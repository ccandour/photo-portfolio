import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';

export const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 12;

// Single user, single process: sessions live in memory. A restart simply logs you out.
const sessions = new Map<string, number>();

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

export function adminEnabled(): boolean {
    const pw = process.env.ADMIN_PASSWORD ?? '';
    return pw.length >= MIN_PASSWORD_LENGTH;
}

if (process.env.ADMIN_PASSWORD !== undefined && !adminEnabled()) {
    console.warn(`ADMIN_PASSWORD is shorter than ${MIN_PASSWORD_LENGTH} characters — admin panel is disabled.`);
}

export function checkPassword(candidate: string): boolean {
    if (!adminEnabled()) return false;
    // Compare fixed-length digests so neither content nor length leaks through timing
    const a = createHash('sha256').update(candidate).digest();
    const b = createHash('sha256').update(process.env.ADMIN_PASSWORD!).digest();
    return timingSafeEqual(a, b);
}

export function createSession(cookies: Cookies): void {
    const token = randomBytes(32).toString('base64url');
    sessions.set(hashToken(token), Date.now() + SESSION_TTL_MS);
    cookies.set(SESSION_COOKIE, token, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: SESSION_TTL_MS / 1000
    });
}

export function isAuthenticated(cookies: Cookies): boolean {
    const token = cookies.get(SESSION_COOKIE);
    if (!token || !adminEnabled()) return false;
    const key = hashToken(token);
    const expires = sessions.get(key);
    if (!expires) return false;
    if (expires < Date.now()) {
        sessions.delete(key);
        return false;
    }
    return true;
}

export function destroySession(cookies: Cookies): void {
    const token = cookies.get(SESSION_COOKIE);
    if (token) sessions.delete(hashToken(token));
    cookies.delete(SESSION_COOKIE, { path: '/' });
}

// --- Login throttling ------------------------------------------------------
// Per-IP: 5 failures per 15 min. Behind a reverse proxy set ADDRESS_HEADER
// (e.g. X-Forwarded-For) or every request shares one IP, which degrades to a global limit.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; resetAt: number }>();

export function loginBlocked(ip: string): boolean {
    const entry = failures.get(ip);
    if (!entry) return false;
    if (entry.resetAt < Date.now()) {
        failures.delete(ip);
        return false;
    }
    return entry.count >= MAX_FAILURES;
}

export function recordFailure(ip: string): void {
    const now = Date.now();
    const entry = failures.get(ip);
    if (!entry || entry.resetAt < now) {
        failures.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else {
        entry.count++;
    }
}

export function clearFailures(ip: string): void {
    failures.delete(ip);
}
