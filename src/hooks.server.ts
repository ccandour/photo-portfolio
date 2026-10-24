import { json, type Handle } from '@sveltejs/kit';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { PHOTOS_DIR, RESPONSIVE_DIR } from '$lib/server/config';
import { isAuthenticated } from '$lib/server/auth';

const MIME: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
};

const MEDIA_ROOTS: [string, string][] = [
    ['/photos/', PHOTOS_DIR],
    ['/responsive/', RESPONSIVE_DIR]
];

/**
 * Photos are served straight from the mounted volumes, so anything uploaded through
 * the admin (or FTP) is live immediately — no image rebuild needed.
 */
async function serveMedia(pathname: string, request: Request): Promise<Response | null> {
    const match = MEDIA_ROOTS.find(([prefix]) => pathname.startsWith(prefix));
    if (!match) return null;
    const [prefix, root] = match;

    let relative: string;
    try {
        relative = decodeURIComponent(pathname.slice(prefix.length));
    } catch {
        return new Response('Bad request', { status: 400 });
    }
    const filePath = path.resolve(root, relative);
    const mime = MIME[path.extname(filePath).toLowerCase()];
    if (!mime || !filePath.startsWith(root + path.sep) || relative.split('/').some(p => p.startsWith('.'))) {
        return new Response('Not found', { status: 404 });
    }

    let stat;
    try {
        stat = await fs.stat(filePath);
        if (!stat.isFile()) throw new Error();
    } catch {
        return new Response('Not found', { status: 404 });
    }

    // Files can be replaced in place from the admin, so revalidate via ETag rather than caching forever
    const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    const headers = {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        ETag: etag,
        'Last-Modified': stat.mtime.toUTCString()
    };
    if (request.headers.get('if-none-match') === etag) {
        return new Response(null, { status: 304, headers });
    }
    if (request.method === 'HEAD') {
        return new Response(null, { headers: { ...headers, 'Content-Length': String(stat.size) } });
    }
    const body = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new Response(body, { headers: { ...headers, 'Content-Length': String(stat.size) } });
}

export const handle: Handle = async ({ event, resolve }) => {
    const { pathname } = event.url;

    if (event.request.method === 'GET' || event.request.method === 'HEAD') {
        const media = await serveMedia(pathname, event.request);
        if (media) return media;
    }

    const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
    if (isAdmin) {
        const isLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/');
        event.locals.authenticated = isAuthenticated(event.cookies);

        // Endpoints and actions are not covered by layout loads, so the hard check lives here.
        // Page data requests fall through to admin/(app)/+layout.server.ts, which redirects properly.
        if (!isLogin && !event.locals.authenticated) {
            if (pathname.startsWith('/admin/api/') || event.request.method !== 'GET') {
                return json({ message: 'Not authenticated' }, { status: 401 });
            }
            if (!event.isDataRequest) {
                return new Response(null, { status: 303, headers: { Location: '/admin/login' } });
            }
        }

        const response = await resolve(event);
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('Referrer-Policy', 'same-origin');
        response.headers.set('Cache-Control', 'no-store');
        return response;
    }

    return resolve(event);
};
