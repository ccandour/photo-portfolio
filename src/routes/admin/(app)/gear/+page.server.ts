import type { Actions, PageServerLoad } from './$types';
import { parseGear } from '$lib/server/content';
import { jsonEditor } from '$lib/server/editor';

const editor = jsonEditor('gear.json', parseGear);

export const load: PageServerLoad = editor.load;
export const actions: Actions = { default: editor.save };
