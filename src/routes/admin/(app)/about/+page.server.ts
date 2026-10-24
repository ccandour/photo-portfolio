import type { Actions, PageServerLoad } from './$types';
import { parseAbout } from '$lib/server/content';
import { jsonEditor } from '$lib/server/editor';

const editor = jsonEditor('about.json', parseAbout);

export const load: PageServerLoad = editor.load;
export const actions: Actions = { default: editor.save };
