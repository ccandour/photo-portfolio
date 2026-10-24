import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { AlbumError, getAlbum, MAX_UPLOAD_BYTES } from './albums';
import { exists, safeJoin, sanitizePhotoFilename } from './storage';
import { PHOTOS_DIR, UPLOADS_DIR } from './config';

// Photos are uploaded in small chunks so no single request trips a reverse-proxy body limit
// (nginx defaults to 1 MB) or adapter-node's BODY_SIZE_LIMIT (512 KB default).
export const CHUNK_BYTES = 500 * 1024;
const STALE_MS = 60 * 60 * 1000;

interface PendingUpload {
    albumId: string;
    name: string;
    size: number;
    overwrite: boolean;
    received: number;
    file: string;
    touchedAt: number;
}

const pending = new Map<string, PendingUpload>();

async function cleanupStale(): Promise<void> {
    const now = Date.now();
    for (const [id, upload] of pending) {
        if (now - upload.touchedAt > STALE_MS) {
            pending.delete(id);
            await fs.rm(upload.file, { force: true });
        }
    }
    // Leftovers from before a restart
    for (const f of await fs.readdir(UPLOADS_DIR).catch(() => [] as string[])) {
        const full = path.join(UPLOADS_DIR, f);
        const stat = await fs.stat(full).catch(() => null);
        if (stat && now - stat.mtimeMs > STALE_MS) await fs.rm(full, { force: true });
    }
}

export async function startUpload(albumId: string, input: { name?: unknown; size?: unknown; overwrite?: unknown }): Promise<string> {
    await cleanupStale();
    if (!(await getAlbum(albumId))) throw new AlbumError('Album not found');

    const name = typeof input.name === 'string' ? input.name.slice(0, 255) : '';
    const size = Number(input.size);
    if (!name) throw new AlbumError('Missing filename');
    if (!Number.isSafeInteger(size) || size <= 0) throw new AlbumError('Empty file');
    if (size > MAX_UPLOAD_BYTES) throw new AlbumError(`File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)`);

    // Fail fast on name clashes instead of after sending the whole file (addPhoto re-checks at the end)
    const target = sanitizePhotoFilename(name);
    if (!input.overwrite && target && (await exists(safeJoin(PHOTOS_DIR, albumId, target)))) {
        throw new AlbumError(`${target} already exists in this album (tick "replace existing" to overwrite)`);
    }

    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const id = randomBytes(16).toString('hex');
    const file = path.join(UPLOADS_DIR, `${id}.part`);
    await fs.writeFile(file, '');
    pending.set(id, { albumId, name, size, overwrite: input.overwrite === true, received: 0, file, touchedAt: Date.now() });
    return id;
}

function get(albumId: string, id: string): PendingUpload {
    const upload = pending.get(id);
    if (!upload || upload.albumId !== albumId) throw new AlbumError('Upload expired or unknown — try again');
    return upload;
}

/** Appends a chunk; `offset` must match what was already received, so retries/duplicates can't corrupt the file. */
export async function appendChunk(albumId: string, id: string, offset: number, chunk: Buffer): Promise<number> {
    const upload = get(albumId, id);
    if (offset !== upload.received) throw new AlbumError(`Unexpected offset ${offset}, expected ${upload.received}`);
    if (chunk.length === 0 || chunk.length > CHUNK_BYTES) throw new AlbumError('Invalid chunk size');
    if (upload.received + chunk.length > upload.size) throw new AlbumError('More data than announced');

    await fs.appendFile(upload.file, chunk);
    upload.received += chunk.length;
    upload.touchedAt = Date.now();
    return upload.received;
}

/** Returns the assembled file and forgets the upload (the caller stores it). */
export async function finishUpload(albumId: string, id: string): Promise<{ name: string; buffer: Buffer; overwrite: boolean }> {
    const upload = get(albumId, id);
    pending.delete(id);
    try {
        if (upload.received !== upload.size) throw new AlbumError(`Incomplete upload (${upload.received}/${upload.size} bytes)`);
        return { name: upload.name, buffer: await fs.readFile(upload.file), overwrite: upload.overwrite };
    } finally {
        await fs.rm(upload.file, { force: true });
    }
}

export async function abortUpload(albumId: string, id: string): Promise<void> {
    const upload = pending.get(id);
    if (!upload || upload.albumId !== albumId) return;
    pending.delete(id);
    await fs.rm(upload.file, { force: true });
}
