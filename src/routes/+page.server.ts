import type { PageServerLoad } from './$types';
import { loadAlbums } from '$lib/server';

export const load: PageServerLoad = async () => {
    const albums = await loadAlbums();
    return { albums };
}; 