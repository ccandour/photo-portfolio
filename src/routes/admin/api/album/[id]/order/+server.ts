import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AlbumError, setOrder } from '$lib/server/albums';

export const PUT: RequestHandler = async ({ params, request }) => {
    let body: { order?: unknown };
    try {
        body = await request.json();
    } catch {
        error(400, 'Invalid JSON');
    }
    try {
        await setOrder(params.id, body.order);
        return json({ ok: true });
    } catch (e) {
        if (e instanceof AlbumError) error(409, e.message);
        throw e;
    }
};
