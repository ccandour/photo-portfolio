import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { adminEnabled, checkPassword, clearFailures, createSession, loginBlocked, recordFailure } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.authenticated) redirect(303, '/admin');
    return { enabled: adminEnabled() };
};

export const actions: Actions = {
    default: async ({ request, cookies, getClientAddress }) => {
        if (!adminEnabled()) return fail(503, { error: 'Admin is disabled: set ADMIN_PASSWORD (min. 12 characters).' });

        const ip = getClientAddress();
        if (loginBlocked(ip)) return fail(429, { error: 'Too many failed attempts. Try again in 15 minutes.' });

        const password = (await request.formData()).get('password');
        if (typeof password !== 'string' || !checkPassword(password)) {
            recordFailure(ip);
            // Small fixed delay makes online guessing even less attractive
            await new Promise(r => setTimeout(r, 750));
            return fail(401, { error: 'Wrong password.' });
        }

        clearFailures(ip);
        createSession(cookies);
        redirect(303, '/admin');
    }
};
