import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AlbumError } from '$lib/server/albums';
import { describeFsError } from '$lib/server/storage';
import { CHUNK_BYTES, startUpload } from '$lib/server/uploads';

// Step 1 of a chunked upload: announce the file, get an upload id
export const POST: RequestHandler = async ({ params, request }) => {
    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        error(400, 'Invalid JSON');
    }
    try {
        return json({ uploadId: await startUpload(params.id, body), chunkSize: CHUNK_BYTES });
    } catch (e) {
        if (e instanceof AlbumError) error(400, e.message);
        const fsError = describeFsError(e);
        if (fsError) error(500, fsError);
        throw e;
    }
};
