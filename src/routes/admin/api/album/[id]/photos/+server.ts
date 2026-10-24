import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { describeFsError } from '$lib/server/storage';
import { AlbumError, addPhoto } from '$lib/server/albums';

// One file per request keeps each body small and lets the UI show per-file progress
export const POST: RequestHandler = async ({ params, request }) => {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) error(400, 'No file');

    try {
        const filename = await addPhoto(params.id, file, { overwrite: form.get('overwrite') === 'true' });
        return json({ filename });
    } catch (e) {
        if (e instanceof AlbumError) error(400, e.message);
        console.error('Upload failed:', e);
        error(500, describeFsError(e) ?? 'Processing failed — check server logs');
    }
};
