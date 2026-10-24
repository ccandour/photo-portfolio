import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AlbumError, addPhoto } from '$lib/server/albums';
import { describeFsError } from '$lib/server/storage';
import { abortUpload, appendChunk, finishUpload } from '$lib/server/uploads';

function fail(e: unknown, context: string): never {
    if (e instanceof AlbumError) error(400, e.message);
    console.error(`${context} failed:`, e);
    error(500, describeFsError(e) ?? 'Processing failed — check server logs');
}

// Step 2: raw chunk bytes, ?offset=<bytes already sent>
export const PUT: RequestHandler = async ({ params, request, url }) => {
    const offset = Number(url.searchParams.get('offset'));
    if (!Number.isSafeInteger(offset) || offset < 0) error(400, 'Invalid offset');
    try {
        const received = await appendChunk(params.id, params.uploadId, offset, Buffer.from(await request.arrayBuffer()));
        return json({ received });
    } catch (e) {
        fail(e, 'Chunk upload');
    }
};

// Step 3: assemble, validate and store the photo
export const POST: RequestHandler = async ({ params }) => {
    try {
        const { name, buffer, overwrite } = await finishUpload(params.id, params.uploadId);
        return json({ filename: await addPhoto(params.id, { name, buffer }, { overwrite }) });
    } catch (e) {
        fail(e, 'Upload');
    }
};

export const DELETE: RequestHandler = async ({ params }) => {
    await abortUpload(params.id, params.uploadId);
    return json({ ok: true });
};
