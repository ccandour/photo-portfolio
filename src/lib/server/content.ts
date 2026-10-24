import type { AboutData, GearItem, SocialLink, TrackRecommendation } from '$lib/types';

// Strict shape checks for everything the admin saves into data/*.json.
// Unknown keys are dropped, so a bad payload can never smuggle extra fields into the public pages.

export class ContentError extends Error {}

function obj(value: unknown, where: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ContentError(`${where}: expected an object`);
    return value as Record<string, unknown>;
}

function arr(value: unknown, where: string, max = 200): unknown[] {
    if (!Array.isArray(value)) throw new ContentError(`${where}: expected a list`);
    if (value.length > max) throw new ContentError(`${where}: too many items (max ${max})`);
    return value;
}

function str(value: unknown, where: string, { max = 500, required = true } = {}): string {
    const s = typeof value === 'string' ? value.trim() : '';
    if (required && !s) throw new ContentError(`${where} is required`);
    if (s.length > max) throw new ContentError(`${where} is too long (max ${max})`);
    return s;
}

function url(value: unknown, where: string, required = true): string | undefined {
    const s = str(value, where, { max: 2000, required });
    if (!s) return undefined;
    let parsed: URL;
    try {
        parsed = new URL(s);
    } catch {
        throw new ContentError(`${where} is not a valid URL`);
    }
    // Blocks javascript:, data: etc. — these end up in href attributes
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new ContentError(`${where} must be http(s)`);
    return s;
}

const GEAR_TYPES = ['camera', 'lens', 'accessory'] as const;

export function parseGear(input: unknown): GearItem[] {
    return arr(input, 'gear').map((raw, i) => {
        const o = obj(raw, `gear #${i + 1}`);
        const where = `gear #${i + 1}`;
        if (!GEAR_TYPES.includes(o.type as GearItem['type'])) throw new ContentError(`${where}: type must be camera, lens or accessory`);
        const item: GearItem = {
            type: o.type as GearItem['type'],
            name: str(o.name, `${where} name`, { max: 120 }),
            description: str(o.description, `${where} description`, { max: 2000, required: false }),
            specs: arr(o.specs ?? [], `${where} specs`, 30)
                .map((s, j) => str(s, `${where} spec ${j + 1}`, { max: 200, required: false }))
                .filter(Boolean)
        };
        const link = url(o.url, `${where} url`, false);
        if (link) item.url = link;
        // Not rendered today, but kept so editing never silently drops it
        if (typeof o.image === 'string' && o.image.trim()) item.image = str(o.image, `${where} image`, { max: 500 });
        return item;
    });
}

export function parseMusic(input: unknown): TrackRecommendation[] {
    return arr(input, 'music', 500).map((raw, i) => {
        const o = obj(raw, `track #${i + 1}`);
        const where = `track #${i + 1}`;
        return {
            searchQuery: str(o.searchQuery, `${where} search query`, { max: 300 }),
            description: str(o.description, `${where} description`, { max: 1000, required: false }),
            mood: str(o.mood, `${where} mood`, { max: 60, required: false })
        };
    });
}

function parseLinks(input: unknown, where: string): SocialLink[] {
    return arr(input, where, 50).map((raw, i) => {
        const o = obj(raw, `${where} #${i + 1}`);
        return {
            name: str(o.name, `${where} #${i + 1} name`, { max: 60 }),
            url: url(o.url, `${where} #${i + 1} url`)!,
            description: str(o.description, `${where} #${i + 1} description`, { max: 200, required: false }),
            category: str(o.category, `${where} #${i + 1} category`, { max: 60, required: false })
        };
    });
}

export function parseAbout(input: unknown): AboutData {
    const o = obj(input, 'about');
    return {
        title: str(o.title, 'title', { max: 120 }),
        intro: str(o.intro, 'intro', { max: 3000, required: false }),
        sectionTitle: str(o.sectionTitle, 'section title', { max: 120, required: false }),
        paragraphs: arr(o.paragraphs, 'paragraphs', 30)
            .map((p, i) => str(p, `paragraph ${i + 1}`, { max: 5000, required: false }))
            .filter(Boolean),
        interests: arr(o.interests, 'interests', 50).map((raw, i) => {
            const it = obj(raw, `interest #${i + 1}`);
            return {
                name: str(it.name, `interest #${i + 1} name`, { max: 60 }),
                icon: str(it.icon, `interest #${i + 1} icon`, { max: 16, required: false })
            };
        }),
        primaryLinks: parseLinks(o.primaryLinks, 'main profiles'),
        secondaryLinks: parseLinks(o.secondaryLinks, 'movies, books etc'),
        otherLinks: parseLinks(o.otherLinks, 'for the curious')
    };
}

/** Parses the JSON `payload` field the admin editors submit. */
export function payloadFrom(form: FormData): unknown {
    const raw = form.get('payload');
    if (typeof raw !== 'string' || raw.length > 1_000_000) throw new ContentError('Missing or oversized payload');
    try {
        return JSON.parse(raw);
    } catch {
        throw new ContentError('Payload is not valid JSON');
    }
}
