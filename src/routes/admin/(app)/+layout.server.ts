import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// hooks.server.ts already blocks unauthenticated requests; this covers client-side navigation data requests
export const load: LayoutServerLoad = async ({ locals }) => {
    if (!locals.authenticated) redirect(303, '/admin/login');
    return {};
};
