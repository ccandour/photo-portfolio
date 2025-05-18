import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	base: process.env.NODE_ENV === 'production' ? '/photo-portfolio' : '',
	plugins: [sveltekit()]
});
