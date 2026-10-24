import { fail, type RequestEvent } from '@sveltejs/kit';
import { ContentError, payloadFrom } from './content';
import { dataFile, readJson, writeJson } from './storage';

type DataFile = Parameters<typeof dataFile>[0];

/** Shared load/save for the JSON-backed editors (gear, music, about). */
export function jsonEditor<T>(file: DataFile, parse: (input: unknown) => T) {
    return {
        load: async () => ({ content: await readJson<T>(dataFile(file)) }),
        save: async ({ request }: RequestEvent) => {
            try {
                const content = parse(payloadFrom(await request.formData()));
                await writeJson(dataFile(file), content);
                return { saved: true };
            } catch (e) {
                if (e instanceof ContentError) return fail(400, { error: e.message });
                throw e;
            }
        }
    };
}
