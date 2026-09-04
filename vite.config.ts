import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const host = process.env.TAURI_DEV_HOST;
const fractorchesPort = process.env.FRACTORCHES_PORT || '8787';

export default defineConfig(async () => ({
	plugins: [sveltekit({ preprocess: vitePreprocess() })],

	// fractalstyler2 ships its SASS source; loadPaths lets src/lib/styles/index.sass
	// `@use` it by package path instead of the app keeping a vendored copy.
	css: {
		preprocessorOptions: {
			sass: {
				loadPaths: ['node_modules']
			}
		}
	},

	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent Vite from obscuring rust errors
	clearScreen: false,
	// 2. tauri expects a fixed port, fail if that port is not available
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: 'ws',
					host,
					port: 1421
				}
			: undefined,
		watch: {
			// 3. tell Vite to ignore watching `src-tauri`
			ignored: ['**/src-tauri/**', '**/tests/**', '**/target/**']
		},
		proxy: {
			// Dev-only: browser mode reaches a locally started Fractorches
			// server through the same-origin /api/v1 path; the desktop app
			// resolves the sidecar URL from its own Rust state instead.
			'/api/v1': {
				target: `http://127.0.0.1:${fractorchesPort}`,
				changeOrigin: true
			}
		}
	}
}));
