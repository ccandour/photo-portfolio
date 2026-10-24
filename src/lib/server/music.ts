import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DeezerTrack, TrackRecommendation } from '$lib/types';
import { DATA_DIR } from './config';
import { writeFileAtomic } from './storage';

// Track metadata is stable, so it is cached on disk. Deezer preview URLs are signed and expire
// (~15 min), so the page links to /music/preview/<id>, which redirects to a freshly fetched one.

const CACHE_FILE = path.join(DATA_DIR, '.cache', 'deezer.json');
const REFRESH_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const RETRY_NOT_FOUND_MS = 24 * 60 * 60 * 1000;
const CONCURRENCY = 4;
const TIMEOUT_MS = 5000;

interface CacheEntry {
    track: DeezerTrack | null;
    fetchedAt: number;
}

let cache: Record<string, CacheEntry> | null = null;
const inFlight = new Map<string, Promise<CacheEntry | null>>();

async function loadCache(): Promise<Record<string, CacheEntry>> {
    if (cache) return cache;
    try {
        cache = JSON.parse(await fs.readFile(CACHE_FILE, 'utf-8'));
    } catch {
        cache = {};
    }
    return cache!;
}

async function persist(): Promise<void> {
    try {
        await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
        await writeFileAtomic(CACHE_FILE, JSON.stringify(cache));
    } catch (e) {
        // Cache still works in memory; it just won't survive a restart
        console.warn('Could not persist Deezer cache:', e);
    }
}

async function deezer<T>(endpoint: string): Promise<T> {
    const res = await fetch(`https://api.deezer.com${endpoint}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Deezer ${res.status}`);
    const body = await res.json();
    if (body?.error) throw new Error(`Deezer: ${body.error.message ?? 'error'}`);
    return body as T;
}

function lookup(query: string): Promise<CacheEntry | null> {
    let pending = inFlight.get(query);
    if (!pending) {
        pending = deezer<{ data: DeezerTrack[] }>(`/search?q=${encodeURIComponent(query)}&limit=1`)
            .then(({ data }) => {
                const entry = { track: data?.[0] ?? null, fetchedAt: Date.now() };
                cache![query] = entry;
                return entry;
            })
            .catch(e => {
                console.warn(`Deezer lookup failed for "${query}":`, e.message);
                return null;
            })
            .finally(() => inFlight.delete(query));
        inFlight.set(query, pending);
    }
    return pending;
}

async function lookupAll(queries: string[]): Promise<void> {
    const queue = [...queries];
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        for (let q = queue.shift(); q !== undefined; q = queue.shift()) await lookup(q);
    }));
    if (queries.length) await persist();
}

function isStale(entry: CacheEntry): boolean {
    const age = Date.now() - entry.fetchedAt;
    return age > (entry.track ? REFRESH_AFTER_MS : RETRY_NOT_FOUND_MS);
}

/** Attaches Deezer track info. Only never-seen queries block; stale entries refresh in the background. */
export async function withTracks(recommendations: TrackRecommendation[]): Promise<TrackRecommendation[]> {
    const c = await loadCache();
    const queries = [...new Set(recommendations.map(r => r.searchQuery))];

    await lookupAll(queries.filter(q => !c[q]));
    const stale = queries.filter(q => c[q] && isStale(c[q]));
    if (stale.length) lookupAll(stale).catch(() => {});

    return recommendations.map(rec => {
        const track = c[rec.searchQuery]?.track;
        return track ? { ...rec, track: { ...track, preview: `/music/preview/${track.id}` } } : rec;
    });
}

/** Pre-fetch after the admin saves, so visitors never wait on Deezer for new entries. */
export function warmTracks(recommendations: TrackRecommendation[]): void {
    withTracks(recommendations).catch(e => console.warn('Warming Deezer cache failed:', e));
}

export async function isKnownTrack(id: number): Promise<boolean> {
    return Object.values(await loadCache()).some(e => e.track?.id === id);
}

const previews = new Map<number, { url: string; expiresAt: number }>();

/** A currently valid preview URL; refetched shortly before Deezer's signed link expires. */
export async function previewUrl(id: number): Promise<string | null> {
    const cached = previews.get(id);
    if (cached && cached.expiresAt > Date.now()) return cached.url;

    const track = await deezer<DeezerTrack>(`/track/${id}`);
    if (!track.preview) return null;
    const exp = Number(/exp=(\d+)/.exec(track.preview)?.[1]);
    const expiresAt = exp ? exp * 1000 - 60_000 : Date.now() + 5 * 60_000;
    previews.set(id, { url: track.preview, expiresAt });
    return track.preview;
}
