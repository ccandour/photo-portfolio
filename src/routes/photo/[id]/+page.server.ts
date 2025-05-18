import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadAlbums } from '$lib/server';

export const load: PageServerLoad = async ({ params }) => {
  const albums = await loadAlbums();
  let photo;
  let prevId = null;
  let nextId = null;

  // Find the photo and its adjacent photos
  for (const album of albums) {
    const photoIndex = album.photos.findIndex(p => p.id === params.id);
    if (photoIndex !== -1) {
      photo = album.photos[photoIndex];
      if (photoIndex > 0) {
        prevId = album.photos[photoIndex - 1].id;
      }
      if (photoIndex < album.photos.length - 1) {
        nextId = album.photos[photoIndex + 1].id;
      }
      break;
    }
  }

  if (!photo) {
    throw error(404, 'Photo not found');
  }

  return {
    photo,
    prevId,
    nextId
  };
}; 