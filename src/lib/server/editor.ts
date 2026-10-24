import { fail, type RequestEvent } from '@sveltejs/kit';
import { ContentError, payloadFrom } from './content';
import { dataFile, describeFsError, readJson, writeJson } from './storage';

type DataFile = Parameters<typeof dataFile>[0];

/** Shared load/save for the JSON-backed editors (gear, music, about). */
export function jsonEditor<T>(file: DataFile, parse: (input: unknown) => T, afterSave?: (content: T) => void) {
    return {
        load: async () => ({ content: await readJson<T>(dataFile(file)) }),
        save: async ({ request }: RequestEvent) => {
            try {
                const content = parse(payloadFrom(await request.formData()));
                await writeJson(dataFile(file), content);
                afterSave?.(content);
                return { saved: true };
            } catch (e) {
                if (e instanceof ContentError) return fail(400, { error: e.message });
                const fsError = describeFsError(e);
                if (fsError) {
                    console.error(`Saving ${file} failed:`, e);
                    return fail(500, { error: fsError });
                }
                throw e;
            }
        }
    };
}
