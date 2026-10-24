import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { AlbumError, createAlbum, listAlbums, parseMetadata } from '$lib/server/albums';
import { isValidSlug, slugify } from '$lib/server/storage';

export const load: PageServerLoad = async () => {
    const albums = await listAlbums();
    return {
        albums: albums.map(a => ({ id: a.id, metadata: a.metadata, count: a.photos.length, cover: a.photos[0] ?? null }))
    };
};

export const actions: Actions = {
    create: async ({ request }) => {
        const form = Object.fromEntries(await request.formData());
        try {
            const metadata = parseMetadata(form);
            const requested = typeof form.folder === 'string' ? form.folder.trim() : '';
            const id = requested || slugify(metadata.location);
            if (!isValidSlug(id)) throw new AlbumError('Folder name: lowercase letters, digits, - and _ only');
            await createAlbum(id, metadata);
            redirect(303, `/admin/album/${id}`);
        } catch (e) {
            if (e instanceof AlbumError) return fail(400, { error: e.message, values: form as Record<string, string> });
            throw e;
        }
    }
};
