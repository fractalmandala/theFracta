import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type Plugin } from 'vite';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { homedir } from 'node:os';
import { join } from 'node:path';

const host = process.env.TAURI_DEV_HOST;

/**
 * Dev-only bridge from browser mode to the running Fractorches sidecar.
 *
 * The two halves of the app find Fractorches differently. The desktop app asks
 * Rust, which owns the process and knows the port it spawned it on. A plain
 * browser has no Tauri bridge, so `resolveEndpoint()` falls back to a
 * same-origin `/api/v1` and it is this dev server that has to answer.
 *
 * That fallback was pointed at a fixed port — `FRACTORCHES_PORT || 8787` —
 * while the app spawns the sidecar on a *random free port*. So in browser mode
 * every Observatory request proxied to a port nothing was listening on, and the
 * surface reported "Session index unavailable / 500" while a healthy sidecar
 * was serving a few thousand ports away.
 *
 * The sidecar publishes where it is listening in `<data dir>/daemon.<pid>.json`,
 * which is the same source of truth `src-tauri/src/sidecar.rs` reads. That data
 * directory is Fracta's own, not `~/.agentsview` — the standalone AgentsView app
 * owns that one, and reading it here would point browser mode at a server this
 * app neither started nor controls. Resolving per request rather than at startup matters because
 * `tauri dev` restarts the app — and so respawns the sidecar on a new port — on
 * every Rust change, which would otherwise leave the dev server pointing at a
 * dead port until it too was restarted.
 */
function fractorchesDevProxy(): Plugin {
	const PREFIX = '/api/v1';
	let cached: { origin: string; at: number } | null = null;

	/** The newest descriptor whose address we can still parse. */
	function discover(): string | null {
		const explicit = process.env.FRACTORCHES_PORT;
		if (explicit) return `http://127.0.0.1:${explicit}`;
		try {
			// Fracta's own Fractorches data directory, matching data_dir() in
			// src-tauri/src/sidecar.rs. Not ~/.agentsview.
			const dir = join(
				homedir(),
				'Library',
				'Application Support',
				'fracta-knowledge',
				'fractorches'
			);
			let best: { mtime: number; address: string } | null = null;
			for (const name of readdirSync(dir)) {
				if (!name.startsWith('daemon.') || !name.endsWith('.json')) continue;
				const path = join(dir, name);
				try {
					const address = JSON.parse(readFileSync(path, 'utf8'))?.address;
					if (typeof address !== 'string') continue;
					const mtime = statSync(path).mtimeMs;
					// More than one descriptor can survive an unclean exit; the most
					// recently written one is the live instance.
					if (!best || mtime > best.mtime) best = { mtime, address };
				} catch {
					/* a descriptor being written as we read it — skip this pass */
				}
			}
			return best ? `http://${best.address}` : null;
		} catch {
			return null;
		}
	}

	function origin(): string | null {
		// Short cache: long enough to spare a directory read per request, short
		// enough that a sidecar restart is picked up without touching anything.
		if (cached && Date.now() - cached.at < 2000) return cached.origin;
		const found = discover();
		cached = found ? { origin: found, at: Date.now() } : null;
		return found;
	}

	return {
		name: 'fractorches-dev-proxy',
		configureServer(server) {
			server.middlewares.use(PREFIX, (req, res) => {
				const target = origin();
				if (!target) {
					// Truthful unavailability rather than a misleading 500 from a
					// port that was never the right one.
					res.statusCode = 503;
					res.setHeader('content-type', 'application/json');
					res.end(
						JSON.stringify({
							error: "No running Fractorches instance found in Fracta's data directory. Start the desktop app, or set FRACTORCHES_PORT."
						})
					);
					return;
				}

				// server.middlewares.use(prefix, …) strips the prefix from req.url,
				// so it has to be put back before forwarding.
				const url = new URL(`${target}${PREFIX}${req.url ?? '/'}`);
				const upstream = httpRequest(
					{
						protocol: url.protocol,
						hostname: url.hostname,
						port: url.port,
						path: url.pathname + url.search,
						method: req.method,
						headers: { ...req.headers, host: url.host }
					},
					(response) => {
						res.writeHead(response.statusCode ?? 502, response.headers);
						response.pipe(res);
					}
				);
				upstream.on('error', (error) => {
					// The cached origin has gone stale — most likely the app restarted
					// onto a new port. Drop it so the next request rediscovers.
					cached = null;
					res.statusCode = 502;
					res.setHeader('content-type', 'application/json');
					res.end(JSON.stringify({ error: `Fractorches unreachable at ${target}: ${error.message}` }));
				});
				req.pipe(upstream);
			});
		}
	};
}

export default defineConfig(async () => ({
	plugins: [sveltekit({ preprocess: vitePreprocess() }), fractorchesDevProxy()],

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
		}
	}
}));
