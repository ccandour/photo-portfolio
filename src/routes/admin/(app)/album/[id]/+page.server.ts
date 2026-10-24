import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { describeFsError } from '$lib/server/storage';
import { AlbumError, deleteAlbum, deletePhoto, getAlbum, MAX_UPLOAD_BYTES, parseMetadata, regenerateVariants, updateMetadata } from '$lib/server/albums';

export const load: PageServerLoad = async ({ params }) => {
    let album;
    try {
        album = await getAlbum(params.id);
    } catch (e) {
        if (e instanceof AlbumError) error(404, 'Album not found');
        throw e;
    }
    if (!album) error(404, 'Album not found');
    return { album, maxUploadMb: MAX_UPLOAD_BYTES / 1024 / 1024 };
};

async function run(fn: () => Promise<string>) {
    try {
        return { ok: await fn() };
    } catch (e) {
        if (e instanceof AlbumError) return fail(400, { error: e.message });
        const fsError = describeFsError(e);
        if (fsError) {
            console.error('Album action failed:', e);
            return fail(500, { error: fsError });
        }
        throw e;
    }
}

export const actions: Actions = {
    metadata: async ({ params, request }) =>
        run(async () => {
            await updateMetadata(params.id, parseMetadata(Object.fromEntries(await request.formData())));
            return 'Album details saved';
        }),

    deletePhoto: async ({ params, request }) =>
        run(async () => {
            const filename = String((await request.formData()).get('filename') ?? '');
            await deletePhoto(params.id, filename);
            return `Moved ${filename} to trash`;
        }),

    regenerate: async ({ params }) =>
        run(async () => `Checked ${await regenerateVariants(params.id)} photos, missing sizes generated`),

    deleteAlbum: async ({ params, request }) => {
        const confirm = String((await request.formData()).get('confirm') ?? '');
        if (confirm !== params.id) return fail(400, { error: 'Type the folder name exactly to confirm' });
        const result = await run(async () => {
            await deleteAlbum(params.id);
            return '';
        });
        if ('ok' in result) redirect(303, '/admin');
        return result;
    }
};
