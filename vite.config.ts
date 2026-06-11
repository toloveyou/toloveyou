
import { type KitConfig } from '@sveltejs/kit';
import { config } from 'process';
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';


export default defineConfig({
	plugins: [
		sveltekit()]
});
