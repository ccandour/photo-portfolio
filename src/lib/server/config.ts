import path from 'node:path';

// All writable locations live here so the admin and the public pages agree on paths
export const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');
export const PHOTOS_DIR = path.resolve(process.env.PHOTOS_DIR || 'static/photos');
export const RESPONSIVE_DIR = path.resolve(process.env.RESPONSIVE_DIR || 'static/responsive');

// Deleted albums/photos are moved here instead of being removed (dot-dir, ignored by loadAlbums)
export const TRASH_DIR = path.join(PHOTOS_DIR, '.trash');
// In-progress chunked uploads (same volume as the photos, dot-dir so it is never listed or served)
export const UPLOADS_DIR = path.join(PHOTOS_DIR, '.uploads');
export const BACKUP_DIR = path.join(DATA_DIR, '.backups');

export const RESPONSIVE_WIDTHS = [400, 800, 1200];
export const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
