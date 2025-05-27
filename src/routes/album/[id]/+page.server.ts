import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { loadAlbums } from '$lib/server';

export const load: PageServerLoad = async ({ params }) => {
    const albums = await loadAlbums();
    let selectedAlbum;
    const location = params.id.split('@')[0];
    const date = params.id.split('@')[1];
    for (const album of albums) {
        if (album.metadata.date.replaceAll('.','-').toLowerCase() === date && album.metadata.location.toLowerCase() === location) {
            selectedAlbum = album;
            break;
        }
    }  
  if (!selectedAlbum) {
    throw error(404, 'Album not found');
  }
  
  return {
    album: selectedAlbum
  };
};