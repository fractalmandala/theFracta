import * as fs from 'node:fs';
import * as path from 'node:path';
import { serializeOKFDocument } from '../core/document.ts';
import type { ClusterSummary, OKFFronmatter } from '../types.ts';

export function scaffoldKnowledgeBundle(
  bundleDir: string = 'knowledge',
  clusterSummary?: ClusterSummary
): { createdCount: number } {
  const root = path.resolve(bundleDir);
  fs.mkdirSync(root, { recursive: true });

  const subdirs = ['core-concepts', 'projects', 'conventions', 'case-histories', 'glossary'];
  for (const dir of subdirs) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }

  let createdCount = 0;

  // 1. Root index.md
  const rootIndexPath = path.join(root, 'index.md');
  if (!fs.existsSync(rootIndexPath)) {
    const rootDoc = serializeOKFDocument({
      frontmatter: {
        type: 'Bundle Index',
        title: 'Engineering Knowledge Base',
        description: 'Curated technical knowledge base mined from 100,000+ multi-agent sessions.',
        status: 'stable',
        generated: {
          by: 'okf-local/0.2.0',
          at: new Date().toISOString(),
        },
      },
      body: `# Engineering Knowledge Base

Welcome to the local OKF engineering knowledge base. This repository preserves high-value patterns, architectural decisions, and troubleshooting breakthroughs crystallized from multi-agent chat transcripts.

## Knowledge Sections

* **[Core Concepts](core-concepts/index.md)**: Fundamental recipes, component patterns, and architecture guides.
* **[Projects](projects/index.md)**: Dossiers on active and completed codebases.
* **[Conventions](conventions/index.md)**: System rules, styling guidelines, and engineering standards.
* **[Case Histories](case-histories/index.md)**: Postmortems, hard debugging breakthroughs, and migrations.
* **[Glossary](glossary/index.md)**: Project-specific vocabulary and mental models.

See [log.md](log.md) for the dated record of changes.`,
    });
    fs.writeFileSync(rootIndexPath, rootDoc, 'utf-8');
    createdCount++;
  }

  // 2. log.md
  const logPath = path.join(root, 'log.md');
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(
      logPath,
      `# Knowledge Base Log

## ${new Date().toISOString().slice(0, 10)}
* Initialized local OKF knowledge bundle scaffold.
`,
      'utf-8'
    );
    createdCount++;
  }

  // 3. Scaffolding default or mined initial concepts
  const taxonomy = clusterSummary?.suggestedTaxonomy || {
    coreConcepts: ['responsive-drawer-layout', 'svelte-5-runes-reactive-patterns', 'tauri-v2-desktop-scaffold'],
    projects: ['knowledge-catalog', 'mandala-ui'],
    conventions: ['single-tab-indented-sass-rules', 'local-first-zero-cloud-philosophy'],
    caseHistories: ['adk-to-local-okf-migration'],
    glossary: ['open-knowledge-format-okf'],
  };

  createdCount += scaffoldSection(root, 'core-concepts', 'Concept', taxonomy.coreConcepts, [
    'Frontend',
    'Architecture',
  ]);
  createdCount += scaffoldSection(root, 'projects', 'Project', taxonomy.projects, ['Workspace', 'Codebase']);
  createdCount += scaffoldSection(root, 'conventions', 'Convention', taxonomy.conventions, [
    'Rules',
    'Preferences',
  ]);
  createdCount += scaffoldSection(root, 'case-histories', 'Case History', taxonomy.caseHistories, [
    'Postmortem',
    'Breakthrough',
  ]);
  createdCount += scaffoldSection(root, 'glossary', 'Glossary Term', taxonomy.glossary, [
    'Terminology',
  ]);

  return { createdCount };
}

function scaffoldSection(
  root: string,
  dirName: string,
  conceptType: string,
  conceptSlugs: string[],
  defaultTags: string[]
): number {
  let count = 0;
  const targetDir = path.join(root, dirName);

  // Section index.md
  const sectionIndexPath = path.join(targetDir, 'index.md');
  if (!fs.existsSync(sectionIndexPath)) {
    const title = dirName
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const doc = serializeOKFDocument({
      frontmatter: {
        type: 'Directory Index',
        title,
        description: `Index of all documents under ${dirName}/.`,
      },
      body: `# ${title}\n\nNavigation index for ${dirName}. Regenerate anytime via \`okf index\`.\n`,
    });
    fs.writeFileSync(sectionIndexPath, doc, 'utf-8');
    count++;
  }

  // Scaffold concepts
  for (const slug of conceptSlugs) {
    const filePath = path.join(targetDir, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      const title = slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const doc = serializeOKFDocument({
        frontmatter: {
          type: conceptType,
          title,
          description: `Draft documentation for ${title}.`,
          status: 'draft',
          tags: defaultTags,
          sources: [
            {
              id: 'initial-scaffold',
              title: 'Mined from local multi-agent sessions',
              reference: 'session-catalog',
            },
          ],
        },
        body: `# ${title}

## Summary
[Pending enrichment: High-signal overview of this concept based on multi-agent chat transcripts.]

## Data & Technical Details
* **Core Components**: ...
* **Key Mechanisms**: ...

## Usage Details
* **Integration Example**: ...
* **Caveats & Nuances**: ...

## Citations
* **Session Mining**: Mined from local session transcripts.
`,
      });
      fs.writeFileSync(filePath, doc, 'utf-8');
      count++;
    }
  }

  return count;
}
