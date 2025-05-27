import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { loadAlbums } from '$lib/server';

export const load: PageServerLoad = async ({ params }) => {
  const albums = await loadAlbums();
  const photoId = params.id;
  
  // Find the album containing this photo
  let album = null;
  let photo = null;
  let photoIndex = -1;
  
  for (const currentAlbum of albums) {
    const foundIndex = currentAlbum.photos.findIndex(p => p.id === photoId);
    if (foundIndex !== -1) {
      album = currentAlbum;
      photo = currentAlbum.photos[foundIndex];
      photoIndex = foundIndex;
      break;
    }
  }
  
  if (!photo || !album) {
    throw error(404, 'Photo not found');
  }
  
  // Construct album ID the same way as in your album route
  const albumId = `${album.metadata.location.toLowerCase()}@${album.metadata.date.replaceAll('.', '-').toLowerCase()}`;
  
  const prevId = photoIndex > 0 ? album.photos[photoIndex - 1].id : null;
  const nextId = photoIndex < album.photos.length - 1 ? album.photos[photoIndex + 1].id : null;
  
  return {
    photo,
    album: {
      ...album,
      id: albumId // Add the constructed ID to the album
    },
    prevId,
    nextId
  };
};