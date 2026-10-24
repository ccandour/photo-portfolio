import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AlbumMetadata } from '$lib/types';
import { PHOTOS_DIR, RESPONSIVE_DIR, SUPPORTED_EXTENSIONS, TRASH_DIR } from './config';
import { sortByOrder } from './photos';
import { deleteVariants, generateVariants, storeOriginal, validateImage } from './images';
import { exists, isValidPhotoFilename, isValidSlug, readJson, safeJoin, sanitizePhotoFilename, writeJson } from './storage';

export const MAX_UPLOAD_BYTES = 60 * 1024 * 1024;
const DATE_RE = /^(0[1-9]|[12]\d|3[01])\.(0[1-9]|1[0-2])\.\d{4}$/;

export class AlbumError extends Error {}

export interface AdminAlbum {
    id: string;
    metadata: AlbumMetadata;
    photos: string[];
}

// Serialise writes per album so concurrent uploads can't clobber metadata.json
const locks = new Map<string, Promise<unknown>>();
function withLock<T>(albumId: string, fn: () => Promise<T>): Promise<T> {
    const prev = locks.get(albumId) ?? Promise.resolve();
    const next = prev.catch(() => {}).then(fn);
    locks.set(albumId, next);
    next.finally(() => { if (locks.get(albumId) === next) locks.delete(albumId); }).catch(() => {});
    return next;
}

function albumDir(albumId: string): string {
    if (!isValidSlug(albumId)) throw new AlbumError('Invalid album id');
    return safeJoin(PHOTOS_DIR, albumId);
}

function photoPath(albumId: string, filename: string): string {
    if (!isValidPhotoFilename(filename)) throw new AlbumError('Invalid photo filename');
    return safeJoin(albumDir(albumId), filename);
}

export function parseMetadata(input: Record<string, unknown>): Omit<AlbumMetadata, 'order'> {
    const str = (key: string, max: number, required = true) => {
        const value = typeof input[key] === 'string' ? (input[key] as string).trim() : '';
        if (required && !value) throw new AlbumError(`${key} is required`);
        if (value.length > max) throw new AlbumError(`${key} is too long (max ${max})`);
        return value;
    };
    const metadata = {
        title: str('title', 120),
        location: str('location', 60),
        date: str('date', 10),
        description: str('description', 2000, false)
    };
    if (!DATE_RE.test(metadata.date)) throw new AlbumError('date must be DD.MM.YYYY');
    if (/[/@?#\\]/.test(metadata.location)) throw new AlbumError('location cannot contain / @ ? # \\ (it is used in the album URL)');
    return metadata;
}

async function listPhotoFiles(dir: string): Promise<string[]> {
    return (await fs.readdir(dir)).filter(f => SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase()));
}

async function readMetadata(albumId: string): Promise<AlbumMetadata> {
    return readJson<AlbumMetadata>(path.join(albumDir(albumId), 'metadata.json'));
}

async function writeMetadata(albumId: string, metadata: AlbumMetadata): Promise<void> {
    // Album metadata is small and edited rarely; the trash covers recovery, so no per-edit backups
    await writeJson(path.join(albumDir(albumId), 'metadata.json'), metadata, { withBackup: false });
}

export async function getAlbum(albumId: string): Promise<AdminAlbum | null> {
    const dir = albumDir(albumId);
    if (!(await exists(path.join(dir, 'metadata.json')))) return null;
    const metadata = await readMetadata(albumId);
    return { id: albumId, metadata, photos: sortByOrder(await listPhotoFiles(dir), metadata.order) };
}

export async function listAlbums(): Promise<AdminAlbum[]> {
    await fs.mkdir(PHOTOS_DIR, { recursive: true });
    const dirs = (await fs.readdir(PHOTOS_DIR, { withFileTypes: true }))
        .filter(d => d.isDirectory() && isValidSlug(d.name))
        .map(d => d.name);

    const albums: AdminAlbum[] = [];
    for (const id of dirs) {
        try {
            const album = await getAlbum(id);
            if (album) albums.push(album);
        } catch (e) {
            console.error(`Admin: could not read album ${id}:`, e);
        }
    }
    const time = (d: string) => new Date(d.split('.').reverse().join('-')).getTime();
    return albums.sort((a, b) => time(b.metadata.date) - time(a.metadata.date));
}

export async function createAlbum(albumId: string, metadata: Omit<AlbumMetadata, 'order'>): Promise<void> {
    const dir = albumDir(albumId);
    if (await exists(dir)) throw new AlbumError(`Album folder "${albumId}" already exists`);
    await fs.mkdir(dir, { recursive: true });
    await writeMetadata(albumId, { ...metadata, order: [] });
}

export function updateMetadata(albumId: string, metadata: Omit<AlbumMetadata, 'order'>): Promise<void> {
    return withLock(albumId, async () => {
        const current = await readMetadata(albumId);
        await writeMetadata(albumId, { ...metadata, order: current.order ?? [] });
    });
}

export function setOrder(albumId: string, order: unknown): Promise<void> {
    return withLock(albumId, async () => {
        const files = await listPhotoFiles(albumDir(albumId));
        if (!Array.isArray(order) || order.length !== files.length ||
            new Set(order).size !== order.length || !order.every(f => typeof f === 'string' && files.includes(f))) {
            throw new AlbumError('Order is out of date — reload the page and try again');
        }
        const metadata = await readMetadata(albumId);
        await writeMetadata(albumId, { ...metadata, order: order as string[] });
    });
}

export function addPhoto(albumId: string, file: { name: string; buffer: Buffer }, { overwrite = false } = {}): Promise<string> {
    return withLock(albumId, async () => {
        const { buffer } = file;
        if (!(await getAlbum(albumId))) throw new AlbumError('Album not found');
        if (buffer.length === 0) throw new AlbumError('Empty file');
        if (buffer.length > MAX_UPLOAD_BYTES) throw new AlbumError(`File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)`);

        let info;
        try {
            info = await validateImage(buffer);
        } catch {
            throw new AlbumError(`${file.name}: not a valid JPEG, PNG or WebP image`);
        }

        // Extension follows the real format, not whatever the uploaded name claimed
        const ext = info.format === 'jpeg' ? '.jpg' : `.${info.format}`;
        const safe = sanitizePhotoFilename(file.name.replace(/\.[^/.]+$/, '') + ext);
        if (!safe) throw new AlbumError(`${file.name}: cannot derive a safe filename — rename it (letters, digits, - and _)`);

        const dest = photoPath(albumId, safe);
        const replacing = await exists(dest);
        if (replacing && !overwrite) throw new AlbumError(`${safe} already exists in this album (tick "replace existing" to overwrite)`);

        if (replacing) {
            await moveToTrash(dest, `${albumId}-${safe}`);
            await deleteVariants(albumId, safe);
        }
        await storeOriginal(buffer, dest);
        await generateVariants(dest, albumId, safe, { force: true });

        const metadata = await readMetadata(albumId);
        const order = metadata.order ?? sortByOrder(await listPhotoFiles(albumDir(albumId)));
        if (!order.includes(safe)) order.push(safe);
        await writeMetadata(albumId, { ...metadata, order });
        return safe;
    });
}

async function moveToTrash(source: string, label: string): Promise<void> {
    await fs.mkdir(TRASH_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.rename(source, path.join(TRASH_DIR, `${stamp}_${label}`));
}

export function deletePhoto(albumId: string, filename: string): Promise<void> {
    return withLock(albumId, async () => {
        const target = photoPath(albumId, filename);
        if (!(await exists(target))) throw new AlbumError('Photo not found');
        await moveToTrash(target, `${albumId}-${filename}`);
        await deleteVariants(albumId, filename);

        const metadata = await readMetadata(albumId);
        await writeMetadata(albumId, { ...metadata, order: (metadata.order ?? []).filter(f => f !== filename) });
    });
}

export function deleteAlbum(albumId: string): Promise<void> {
    return withLock(albumId, async () => {
        const dir = albumDir(albumId);
        if (!(await exists(dir))) throw new AlbumError('Album not found');
        await moveToTrash(dir, albumId);
        await fs.rm(safeJoin(RESPONSIVE_DIR, albumId), { recursive: true, force: true });
    });
}

/** Rebuilds missing responsive variants, e.g. for photos that were added over FTP. */
export function regenerateVariants(albumId: string): Promise<number> {
    return withLock(albumId, async () => {
        const dir = albumDir(albumId);
        const files = (await listPhotoFiles(dir)).filter(isValidPhotoFilename);
        for (const file of files) await generateVariants(path.join(dir, file), albumId, file);
        return files.length;
    });
}
