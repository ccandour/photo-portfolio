import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Album, AlbumMetadata, Photo } from '$lib/types';
import exifr from 'exifr';

const PHOTOS_DIR = 'static/photos';

export async function loadAlbums(): Promise<Album[]> {
    const albums: Album[] = [];
    
    const albumDirs = readdirSync(PHOTOS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const albumId of albumDirs) {
        const albumPath = join(PHOTOS_DIR, albumId);
        
        try {
            const metadataPath = join(albumPath, 'metadata.json');
            const metadata: AlbumMetadata = JSON.parse(
                readFileSync(metadataPath, 'utf-8')
            );

            const photoFiles = readdirSync(albumPath)
                .filter(file => file.toLowerCase().endsWith('.jpg'));

            const photos: Photo[] = [];
            
            for (const filename of photoFiles) {
                const filepath = join(albumPath, filename);
                const exif = await exifr.parse(filepath, {
                    pick: ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ISO', 'ExposureTime']
                });

                photos.push({
                    id: `${albumId}-${filename.replace('.jpg', '')}`,
                    src: `/photos/${albumId}/${filename}`,
                    title: filename.replace('.jpg', '').replace(/-/g, ' '),
                    albumId,
                    metadata: {
                        camera: `${exif.Make} ${exif.Model}`.trim(),
                        lens: exif.LensModel || 'Unknown',
                        focalLength: `${Math.round(exif.FocalLength)}mm`,
                        aperture: `f/${exif.FNumber}`,
                        iso: `ISO ${exif.ISO}`,
                        shutterSpeed: `1/${Math.round(1/exif.ExposureTime)}`
                    }
                });
            }

            albums.push({
                id: albumId,
                metadata,
                photos
            });
        } catch (error) {
            console.error(`Error loading album ${albumId}:`, error);
        }
    }

    return albums;
} 