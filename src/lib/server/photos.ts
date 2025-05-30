import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Album, AlbumMetadata, Photo } from '$lib/types';
import exifr from 'exifr';

const PHOTOS_DIR = 'static/photos';
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export async function loadAlbums(): Promise<Album[]> {
    const albums: Album[] = [];
    
    // Debug: Check if photos directory exists
    if (!existsSync(PHOTOS_DIR)) {
        console.error(`Photos directory does not exist: ${PHOTOS_DIR}`);
        return albums;
    }
    
    console.log(`Loading albums from: ${PHOTOS_DIR}`);
    
    const albumDirs = readdirSync(PHOTOS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    console.log(`Found album directories: ${albumDirs.join(', ')}`);

    for (const albumId of albumDirs) {
        const albumPath = join(PHOTOS_DIR, albumId);
        
        try {
            const metadataPath = join(albumPath, 'metadata.json');
            
            // Check if metadata exists
            if (!existsSync(metadataPath)) {
                console.warn(`No metadata.json found for album: ${albumId}`);
                continue;
            }
            
            const metadata: AlbumMetadata = JSON.parse(
                readFileSync(metadataPath, 'utf-8')
            );

            // Find all supported image files
            const allFiles = readdirSync(albumPath);
            const photoFiles = allFiles.filter(file => {
                const ext = '.' + file.split('.').pop()?.toLowerCase();
                return SUPPORTED_EXTENSIONS.includes(ext);
            });

            console.log(`Album ${albumId}: found ${photoFiles.length} photos`);

            const photos: Photo[] = [];
            
            for (const filename of photoFiles) {
                const filepath = join(albumPath, filename);
                const fileExtension = '.' + filename.split('.').pop()?.toLowerCase();
                const baseFilename = filename.replace(/\.[^/.]+$/, ''); // Remove extension
                
                try {
                    const exif = await exifr.parse(filepath, {
                        pick: ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ISO', 'ExposureTime']
                    });

                    photos.push({
                        id: `${albumId}-${baseFilename}`,
                        src: `/photos/${albumId}/${filename}`,
                        title: baseFilename.replace(/-/g, ' '),
                        albumId,
                        metadata: {
                            camera: `${exif?.Make || ''} ${exif?.Model || ''}`.trim() || 'Unknown',
                            lens: exif?.LensModel || 'Unknown',
                            focalLength: exif?.FocalLength ? `${Math.round(exif.FocalLength)}mm` : 'Unknown',
                            aperture: exif?.FNumber ? `f/${exif.FNumber}` : 'Unknown',
                            iso: exif?.ISO ? `ISO ${exif.ISO}` : 'Unknown',
                            shutterSpeed: exif?.ExposureTime ? `1/${Math.round(1/exif.ExposureTime)}` : 'Unknown'
                        }
                    });
                } catch (exifError) {
                    console.warn(`Could not read EXIF for ${filename}:`, exifError);
                    // Still add the photo without EXIF data
                    photos.push({
                        id: `${albumId}-${baseFilename}`,
                        src: `/photos/${albumId}/${filename}`,
                        title: baseFilename.replace(/-/g, ' '),
                        albumId,
                        metadata: {
                            camera: 'Unknown',
                            lens: 'Unknown',
                            focalLength: 'Unknown',
                            aperture: 'Unknown',
                            iso: 'Unknown',
                            shutterSpeed: 'Unknown'
                        }
                    });
                }
            }

            if (photos.length > 0) {
                albums.push({
                    id: albumId,
                    metadata,
                    photos
                });
                console.log(`Added album ${albumId} with ${photos.length} photos`);
            } else {
                console.warn(`No photos found in album: ${albumId}`);
            }
        } catch (error) {
            console.error(`Error loading album ${albumId}:`, error);
        }
    }

    console.log(`Total albums loaded: ${albums.length}`);
    return albums;
}