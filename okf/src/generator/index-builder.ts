import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseOKFDocument, serializeOKFDocument } from '../core/document.ts';
import type { OKFConcept } from '../types.ts';

export function buildProgressiveIndexes(bundleDir: string = 'knowledge'): { updatedIndexes: string[] } {
  const root = path.resolve(bundleDir);
  if (!fs.existsSync(root)) {
    throw new Error(`Bundle directory not found: ${bundleDir}`);
  }

  const updatedIndexes: string[] = [];

  // Walk all directories that contain markdown files
  const walkDirs = (currentDir: string) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    const subdirs: string[] = [];
    const concepts: OKFConcept[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'wiki-precursor') continue;

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        subdirs.push(fullPath);
        walkDirs(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md' && entry.name !== 'log.md') {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const conceptId = path.basename(entry.name, '.md');
        concepts.push(parseOKFDocument(conceptId, fullPath, content));
      }
    }

    if (currentDir !== root || concepts.length > 0 || subdirs.length > 0) {
      const isRoot = currentDir === root;
      const indexUpdated = writeDirectoryIndex(currentDir, concepts, subdirs, isRoot);
      if (indexUpdated) {
        updatedIndexes.push(path.relative(root, indexUpdated));
      }
    }
  };

  walkDirs(root);
  return { updatedIndexes };
}

function writeDirectoryIndex(
  dirPath: string,
  concepts: OKFConcept[],
  subdirs: string[],
  isRoot: boolean
): string | null {
  const indexPath = path.join(dirPath, 'index.md');
  const dirName = path.basename(dirPath);
  const title = isRoot
    ? 'Knowledge Bundle Index'
    : dirName
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

  let existingFrontmatter: any = {};
  if (fs.existsSync(indexPath)) {
    try {
      const existing = parseOKFDocument('index', indexPath, fs.readFileSync(indexPath, 'utf-8'));
      existingFrontmatter = existing.frontmatter || {};
    } catch {
      // ignore
    }
  }

  const frontmatter = {
    type: 'Directory Index',
    title: existingFrontmatter.title || title,
    description: existingFrontmatter.description || `Navigation index for ${dirName}/.`,
    status: 'stable',
    generated: {
      by: 'okf-local/index-builder',
      at: new Date().toISOString(),
    },
  };

  const bodyLines: string[] = [
    `# ${frontmatter.title}`,
    '',
    `*Auto-generated index for progressive disclosure (${new Date().toISOString().slice(0, 10)}).*`,
    '',
  ];

  if (subdirs.length > 0) {
    bodyLines.push('## Subdirectories', '');
    for (const sub of subdirs) {
      const base = path.basename(sub);
      bodyLines.push(`* 📁 **[${base}/](${base}/index.md)**`);
    }
    bodyLines.push('');
  }

  if (concepts.length > 0) {
    bodyLines.push('## Concepts & Documents', '');
    bodyLines.push('| Document | Type | Status | Description |');
    bodyLines.push('| :--- | :--- | :--- | :--- |');

    for (const c of concepts.sort((a, b) => a.id.localeCompare(b.id))) {
      const docName = c.frontmatter.title || c.id;
      const docType = c.frontmatter.type || 'Concept';
      const docStatus = c.frontmatter.status || 'stable';
      const desc = (c.frontmatter.description || '').replace(/\|/g, '\\|').trim();
      bodyLines.push(`| [${docName}](${c.id}.md) | \`${docType}\` | ${docStatus} | ${desc || '—'} |`);
    }
    bodyLines.push('');
  }

  const serialized = serializeOKFDocument({ frontmatter, body: bodyLines.join('\n') });
  fs.writeFileSync(indexPath, serialized, 'utf-8');
  return indexPath;
}
