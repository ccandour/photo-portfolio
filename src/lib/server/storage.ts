import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BACKUP_DIR, DATA_DIR } from './config';

const MAX_BACKUPS_PER_FILE = 20;

// Album directory names and photo filenames end up in filesystem paths and URLs,
// so they are restricted to a conservative charset (no dots, slashes, spaces).
const SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const FILENAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}\.(jpe?g|png|webp)$/i;

export function isValidSlug(value: string): boolean {
    return SLUG_RE.test(value);
}

export function isValidPhotoFilename(value: string): boolean {
    return FILENAME_RE.test(value);
}

export function slugify(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/ł/g, 'l').replace(/Ł/g, 'L')
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64);
}

/** Turns an uploaded file name into a safe one, keeping it recognisable (e.g. "GDS 004 mono.JPG" -> "GDS-004-mono.jpg"). */
export function sanitizePhotoFilename(original: string): string | null {
    const ext = path.extname(original).toLowerCase();
    const base = path.basename(original, path.extname(original))
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Za-z0-9_-]+/g, '-')
        .replace(/^[-_]+|-+$/g, '')
        .slice(0, 100);
    const name = `${base}${ext === '.jpeg' ? '.jpg' : ext}`;
    return isValidPhotoFilename(name) ? name : null;
}

/** Joins and guarantees the result stays inside `root` (defence in depth on top of the regexes). */
export function safeJoin(root: string, ...parts: string[]): string {
    const resolved = path.resolve(root, ...parts);
    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
        throw new Error(`Path escapes root: ${parts.join('/')}`);
    }
    return resolved;
}

export async function exists(p: string): Promise<boolean> {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

/** Write to a temp file and rename, so a crash never leaves a half-written JSON file behind. */
export async function writeFileAtomic(filePath: string, contents: string | Buffer): Promise<void> {
    const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, contents);
    await fs.rename(tmp, filePath);
}

async function backup(filePath: string): Promise<void> {
    if (!(await exists(filePath))) return;
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const prefix = path.basename(filePath).replace(/[^A-Za-z0-9_.-]/g, '_');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.copyFile(filePath, path.join(BACKUP_DIR, `${prefix}.${stamp}.bak`));

    const old = (await fs.readdir(BACKUP_DIR))
        .filter(f => f.startsWith(prefix + '.') && f.endsWith('.bak'))
        .sort()
        .slice(0, -MAX_BACKUPS_PER_FILE);
    await Promise.all(old.map(f => fs.unlink(path.join(BACKUP_DIR, f))));
}

/** Writes JSON atomically, keeping a timestamped backup of the previous version. */
export async function writeJson(filePath: string, data: unknown, { withBackup = true } = {}): Promise<void> {
    if (withBackup) await backup(filePath);
    await writeFileAtomic(filePath, JSON.stringify(data, null, 2) + '\n');
}

export async function readJson<T>(filePath: string): Promise<T> {
    return JSON.parse(await fs.readFile(filePath, 'utf-8')) as T;
}

export function dataFile(name: 'gear.json' | 'music.json' | 'about.json'): string {
    return path.join(DATA_DIR, name);
}

/** Readable explanation for filesystem errors the admin can fix on the host (e.g. volume ownership). */
export function describeFsError(e: unknown): string | null {
    const err = e as NodeJS.ErrnoException;
    const target = err?.path ? ` (${err.path})` : '';
    switch (err?.code) {
        case 'EACCES':
        case 'EPERM':
            return `Permission denied writing to disk${target}. On the server run: sudo chown -R 1000:1000 data static/photos static/responsive`;
        case 'EROFS':
            return `The volume is mounted read-only${target}.`;
        case 'ENOSPC':
            return `Disk is full${target}.`;
        default:
            return null;
    }
}
