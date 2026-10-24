import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { RESPONSIVE_DIR, RESPONSIVE_WIDTHS } from './config';
import { exists, safeJoin, writeFileAtomic } from './storage';

// Mirrors generate-images.js so uploads from the admin look the same as the batch-processed photos

/** Rejects anything sharp can't decode as a real JPEG/PNG/WebP, whatever the extension says. */
export async function validateImage(buffer: Buffer): Promise<{ format: string; width: number; height: number }> {
    const meta = await sharp(buffer).metadata();
    if (!meta.format || !['jpeg', 'png', 'webp'].includes(meta.format) || !meta.width || !meta.height) {
        throw new Error('Not a supported image (JPEG, PNG or WebP)');
    }
    return { format: meta.format, width: meta.width, height: meta.height };
}

/** Stores an uploaded original, converting JPEGs to progressive with EXIF preserved. */
export async function storeOriginal(buffer: Buffer, destination: string): Promise<void> {
    const meta = await sharp(buffer).metadata();
    if (meta.format === 'jpeg' && !meta.isProgressive) {
        const converted = await sharp(buffer)
            .jpeg({ quality: 95, progressive: true, mozjpeg: true })
            .withMetadata()
            .toBuffer();
        await writeFileAtomic(destination, converted);
    } else {
        await writeFileAtomic(destination, buffer);
    }
}

function variantPaths(albumId: string, filename: string, width: number) {
    const base = filename.replace(/\.[^/.]+$/, '');
    const dir = safeJoin(RESPONSIVE_DIR, albumId);
    return {
        webp: path.join(dir, `${base}-${width}w.webp`),
        jpg: path.join(dir, `${base}-${width}w.jpg`)
    };
}

/** Generates the 400/800/1200w WebP + JPEG variants the public pages expect. */
export async function generateVariants(originalPath: string, albumId: string, filename: string, { force = false } = {}): Promise<void> {
    await fs.mkdir(safeJoin(RESPONSIVE_DIR, albumId), { recursive: true });
    const { width = 0 } = await sharp(originalPath).metadata();

    for (const target of RESPONSIVE_WIDTHS.filter(w => w < width)) {
        const out = variantPaths(albumId, filename, target);

        if (force || !(await exists(out.webp))) {
            await sharp(originalPath)
                .resize({ width: target, withoutEnlargement: true, fit: 'inside' })
                .webp({ quality: 80, effort: 4 })
                .toFile(out.webp);
        }
        if (force || !(await exists(out.jpg))) {
            await sharp(originalPath)
                .resize({ width: target, withoutEnlargement: true, fit: 'inside' })
                .jpeg({ quality: 85, progressive: true, mozjpeg: true })
                .toFile(out.jpg);
        }
    }
}

export async function deleteVariants(albumId: string, filename: string): Promise<void> {
    for (const width of RESPONSIVE_WIDTHS) {
        const out = variantPaths(albumId, filename, width);
        await fs.rm(out.webp, { force: true });
        await fs.rm(out.jpg, { force: true });
    }
}
