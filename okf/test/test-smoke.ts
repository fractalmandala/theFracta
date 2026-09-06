import { strictEqual, ok } from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseOKFDocument, serializeOKFDocument } from '../src/core/document.ts';
import { CatalogDatabase } from '../src/indexer/catalog-db.ts';
import { detectTechnologies } from '../src/clustering/tech-detect.ts';
import { lintOKFBundle } from '../src/linter/validator.ts';

console.log('Running OKF Local Smoke Tests...');

// 1. Document parser & serializer
const testDoc = serializeOKFDocument({
  frontmatter: {
    type: 'Concept',
    title: 'Test Concept',
    tags: ['sveltekit', 'testing'],
    sources: [{ id: 'src-1', title: 'Local Test', reference: '/path/test' }],
  },
  body: 'Hello world\n\nLink to [sibling](sibling.md)',
});

const parsed = parseOKFDocument('test-id', '/path/test.md', testDoc);
strictEqual(parsed.frontmatter.title, 'Test Concept');
strictEqual(parsed.frontmatter.type, 'Concept');
ok(parsed.frontmatter.tags?.includes('sveltekit'));
ok(parsed.linksTo?.includes('sibling'));
console.log('✔ Frontmatter parse/serialize passed');

// 2. Tech detector
const techFound = detectTechnologies('Building a responsive drawer with Svelte 5 runes and Tauri v2');
ok(techFound.includes('SvelteKit 5'));
ok(techFound.includes('Tauri v2'));
console.log('✔ Tech detector passed');

// 3. SQLite Catalog
const testDbPath = '.okf-cache/test-catalog.db';
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

const db = new CatalogDatabase(testDbPath);
db.insertSession({
  id: 'test:1',
  sourceAgent: 'test-agent',
  rawPath: '/mock/session.json',
  timestamp: new Date().toISOString(),
  titleOrFirstPrompt: 'Create a responsive drawer component',
  filesTouched: ['src/Drawer.svelte'],
  artifactsCreated: [],
  techTags: ['sveltekit'],
});

strictEqual(db.getSessionCount(), 1);
db.close();
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
console.log('✔ Native SQLite catalog passed');

// 4. Bundle Linter
const lintRes = lintOKFBundle('knowledge');
strictEqual(lintRes.errorCount, 0);
console.log(`✔ Bundle linter passed on ${lintRes.totalFiles} concepts`);

console.log('\nAll smoke tests passed cleanly!');
