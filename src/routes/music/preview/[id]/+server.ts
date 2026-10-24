import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isKnownTrack, previewUrl } from '$lib/server/music';

// Audio src for the player: always redirects to a non-expired Deezer preview
export const GET: RequestHandler = async ({ params, setHeaders }) => {
    const id = Number(params.id);
    // Only tracks listed on the music page, so this can't be used as a general Deezer proxy
    if (!Number.isSafeInteger(id) || id <= 0 || !(await isKnownTrack(id))) error(404, 'Unknown track');

    let url: string | null;
    try {
        url = await previewUrl(id);
    } catch (e) {
        console.warn(`Preview lookup failed for ${id}:`, e);
        error(502, 'Deezer unavailable');
    }
    if (!url) error(404, 'No preview');

    setHeaders({ 'Cache-Control': 'private, max-age=60' });
    redirect(302, url);
};
