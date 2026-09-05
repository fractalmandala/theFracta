#!/usr/bin/env node
// Fails the build when markup references a class no stylesheet defines.
//
// The Observatory reached 64% dead classes because nothing ever checked. A
// misspelled or invented class is silent in CSS — the browser drops the
// selector and renders unstyled structure — so the only way to keep the
// fractalstyler2 contract honest is to assert against the compiled output.
//
// Usage: node scripts/check-classes.mjs [--json]

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import * as sass from 'sass';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ENTRY = join(ROOT, 'src/lib/styles/index.sass');
const SRC = join(ROOT, 'src');

// Classes that exist for JavaScript, not CSS: query hooks, test ids, and
// classes a third-party library attaches at runtime. Keep this list short and
// justified — it is the only legitimate way past the check.
// _09_canonical_candidates.sass stages changes headed into fractalstyler2, so a
// class there is a proposal, not app CSS. It is compiled into `defined` like any
// other layer, but must never be pruned for being unreferenced by this app.
const ALLOW = new Set([
	'raw-source', // scroll-sync.ts queries pre.raw-source
	'md-content', // SearchOverlay queries article.md-content
	'katex', // KaTeX attaches its own classes at runtime
	'hljs' // highlight.js, likewise
]);

// Vite's sass integration resolves bare package specifiers through node
// resolution; the plain sass API does not, and under pnpm the package lives
// behind a symlink. Resolve fractalstyler2/* to its real path ourselves so the
// linter compiles exactly what the app compiles.
const require = createRequire(import.meta.url);
const FS2 = dirname(require.resolve('fractalstyler2/package.json'));

const packageImporter = {
	findFileUrl(url) {
		if (!url.startsWith('fractalstyler2/')) return null;
		const sub = url.slice('fractalstyler2/'.length);
		const rest = sub === 'styles' ? 'styles/index' : sub;
		return pathToFileURL(join(FS2, 'dist', rest));
	}
};

function definedClasses() {
	const { css } = sass.compile(ENTRY, {
		importers: [packageImporter],
		loadPaths: [join(ROOT, 'node_modules'), join(ROOT, 'src/lib/styles')],
		style: 'expanded',
		silenceDeprecations: ['import', 'global-builtin']
	});
	const out = new Set();
	// Strip declaration blocks so only selectors remain, then harvest .names.
	for (const sel of css.replace(/\{[^{}]*\}/g, '{}').split(/[{}]/)) {
		for (const m of sel.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)) out.add(m[1]);
	}
	return out;
}

function walk(dir, acc = []) {
	for (const name of readdirSync(dir)) {
		if (name === 'node_modules' || name.startsWith('.')) continue;
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p, acc);
		else if (extname(p) === '.svelte') acc.push(p);
	}
	return acc;
}

// Classes a component defines in its own <style> block. Authored components
// must not have one (AGENTS.md), but generated assets — the animated icons —
// ship self-contained, and their classes are legitimately defined.
function localClasses(text) {
	const out = new Set();
	for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
		for (const sel of m[1].replace(/\{[^{}]*\}/g, '{}').split(/[{}]/)) {
			for (const c of sel.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)) out.add(c[1]);
		}
	}
	return out;
}

function usedClasses(files) {
	const used = new Map();
	for (const file of files) {
		const text = readFileSync(file, 'utf8');
		const rel = relative(ROOT, file);
		const local = localClasses(text);
		const add = (cls, line) => {
			if (local.has(cls)) return;
			if (!used.has(cls)) used.set(cls, []);
			used.get(cls).push(`${rel}:${line}`);
		};
		const lineOf = (idx) => text.slice(0, idx).split('\n').length;
		// Fully static class="..." attributes.
		for (const m of text.matchAll(/class="([^"{}]*)"/g)) {
			for (const cls of m[1].split(/\s+/)) {
				if (/^[A-Za-z][A-Za-z0-9_-]*$/.test(cls)) add(cls, lineOf(m.index));
			}
		}
		// Mixed attributes — class="rail rail-{side}" — still carry static tokens,
		// and those were invisible here until a cleanup pass deleted .rail as
		// "unreferenced". Only the interpolated parts are genuinely unverifiable.
		for (const m of text.matchAll(/class="([^"]*\{[^"]*)"/g)) {
			// Drop ${...} template-literal interpolations before splitting, or the
			// JS identifiers inside them read as class names.
			// Truncate at the first ${ — the capture stops at the next quote, so an
			// interpolation is usually left unbalanced and its JS would read as
			// class names. Tokens before it are still real and worth checking.
			for (const cls of m[1].replace(/\$\{[\s\S]*$/, ' ').split(/\s+/)) {
				if (/^[A-Za-z][A-Za-z0-9_-]*$/.test(cls)) add(cls, lineOf(m.index));
			}
		}
		for (const m of text.matchAll(/class:([A-Za-z][A-Za-z0-9_-]*)/g)) {
			add(m[1], lineOf(m.index));
		}
	}
	return used;
}

const json = process.argv.includes('--json');
const defined = definedClasses();
const files = walk(SRC);
const used = usedClasses(files);

const dead = [...used.entries()]
	.filter(([cls]) => !defined.has(cls) && !ALLOW.has(cls))
	// Svelte's own scoping hashes are not authored classes. They are always
	// prefixed — `svelte-<hash>` or `s-<hash>`. A bare six-character word is a
	// real class name, and treating it as a hash silently exempted `.editor`,
	// which was referenced by the editor textarea and defined nowhere.
	.filter(([cls]) => !/^(?:s|svelte)-[A-Za-z0-9]{6,}$/.test(cls))
	.sort((a, b) => b[1].length - a[1].length);

if (json) {
	console.log(JSON.stringify({ defined: defined.size, used: used.size, dead: dead.map(([c, w]) => ({ class: c, uses: w })) }, null, 2));
} else {
	const pct = used.size ? Math.round((dead.length / used.size) * 100) : 0;
	if (dead.length === 0) {
		console.log(`✓ ${used.size} classes referenced, all defined (${defined.size} in the stylesheet)`);
	} else {
		console.error(`✗ ${dead.length} of ${used.size} referenced classes (${pct}%) are not defined anywhere:\n`);
		for (const [cls, where] of dead) {
			console.error(`  ${cls}`);
			for (const w of where.slice(0, 3)) console.error(`      ${w}`);
			if (where.length > 3) console.error(`      … ${where.length - 3} more`);
		}
		console.error(`\nDefine them in src/lib/styles/_08_own.sass, compose them from the`);
		console.error(`fractalstyler2 registry, or add a justified entry to ALLOW in this script.`);
	}
}

process.exit(dead.length === 0 ? 0 : 1);
