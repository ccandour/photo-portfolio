import type { Actions, PageServerLoad } from './$types';
import { parseMusic } from '$lib/server/content';
import { jsonEditor } from '$lib/server/editor';
import { warmTracks } from '$lib/server/music';

const editor = jsonEditor('music.json', parseMusic, warmTracks);

export const load: PageServerLoad = editor.load;
export const actions: Actions = { default: editor.save };
