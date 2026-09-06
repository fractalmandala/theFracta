import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseOKFDocument, serializeOKFDocument } from '../core/document.ts';
import type { OKFFronmatter, OKFSource } from '../types.ts';

export interface PrecursorIngestStats {
  totalFiles: number;
  migratedCount: number;
  bySection: Record<string, number>;
  byType: Record<string, number>;
}

const TYPE_TO_SECTION: Record<string, { section: string; canonicalType: string }> = {
  concept: { section: 'core-concepts', canonicalType: 'Concept' },
  pattern: { section: 'core-concepts', canonicalType: 'Pattern' },
  recipe: { section: 'core-concepts', canonicalType: 'Recipe' },
  system: { section: 'systems', canonicalType: 'System' },
  decision: { section: 'decisions', canonicalType: 'Decision' },
  broken: { section: 'case-histories', canonicalType: 'Case History' },
};

export function ingestPrecursorFiles(
  precursorDir: string,
  bundleDir: string
): PrecursorIngestStats {
  const srcDir = path.resolve(precursorDir);
  const destDir = path.resolve(bundleDir);

  if (!fs.existsSync(srcDir)) {
    throw new Error(`Precursor directory does not exist: ${srcDir}`);
  }

  fs.mkdirSync(destDir, { recursive: true });

  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md') && f !== 'index.md' && f !== 'log.md');
  const bySection: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let migratedCount = 0;

  for (const filename of files) {
    const filePath = path.join(srcDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const conceptId = path.basename(filename, '.md');

    let doc;
    try {
      doc = parseOKFDocument(conceptId, filePath, content);
    } catch {
      continue;
    }

    const fm = doc.frontmatter as any;
    const rawType = String(fm.type || 'concept').toLowerCase();
    const mapping = TYPE_TO_SECTION[rawType] || { section: 'core-concepts', canonicalType: 'Concept' };

    const targetSection = mapping.section;
    const canonicalType = mapping.canonicalType;

    const sectionDir = path.join(destDir, targetSection);
    fs.mkdirSync(sectionDir, { recursive: true });

    // Map chatRefs to OKF v0.2 sources
    const sources: OKFSource[] = [];
    if (Array.isArray(fm.chatRefs)) {
      for (const ref of fm.chatRefs) {
        const parts = String(ref).split(':');
        const toolName = parts[0] || 'session';
        sources.push({
          id: String(ref),
          title: `${toolName} transcript ref`,
          reference: String(ref),
          timestamp: fm.createdAt ? String(fm.createdAt) : undefined,
        });
      }
    } else if (Array.isArray(fm.sources)) {
      sources.push(...fm.sources);
    }

    const newFrontmatter: OKFFronmatter = {
      type: canonicalType,
      title: fm.title || conceptId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: fm.summary || fm.description || undefined,
      status: (fm.status === 'stable' || fm.status === 'deprecated') ? fm.status : 'draft',
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      sources: sources.length > 0 ? sources : undefined,
      generated: {
        by: 'okf-precursor-migrator',
        at: new Date().toISOString(),
      },
    };

    if (fm.createdAt) (newFrontmatter as any).created = fm.createdAt;
    if (fm.updatedAt) (newFrontmatter as any).updated = fm.updatedAt;

    const newDocText = serializeOKFDocument({
      frontmatter: newFrontmatter,
      body: doc.body,
    });

    const targetFilePath = path.join(sectionDir, filename);
    fs.writeFileSync(targetFilePath, newDocText, 'utf-8');

    migratedCount++;
    bySection[targetSection] = (bySection[targetSection] || 0) + 1;
    byType[canonicalType] = (byType[canonicalType] || 0) + 1;
  }

  // Ensure root index.md and log.md exist
  ensureRootBundleFiles(destDir);

  return {
    totalFiles: files.length,
    migratedCount,
    bySection,
    byType,
  };
}

function ensureRootBundleFiles(bundleDir: string): void {
  const rootIndex = path.join(bundleDir, 'index.md');
  if (!fs.existsSync(rootIndex)) {
    const text = serializeOKFDocument({
      frontmatter: {
        type: 'Bundle Index',
        title: 'Fracta Era 1 Engineering Wiki',
        description: 'Comprehensive engineering knowledge base mined from 100,000+ multi-agent sessions.',
        status: 'stable',
        generated: {
          by: 'okf-local/0.2.0',
          at: new Date().toISOString(),
        },
      },
      body: `# Fracta Era 1 Engineering Wiki

Curated knowledge base represented in **Open Knowledge Format (OKF v0.2)**.

## Knowledge Sections

* **[Core Concepts](core-concepts/index.md)**: Foundational concepts, recipes, and UI patterns.
* **[Systems](systems/index.md)**: Architectural specs and dossiers for systems, tools, and apps.
* **[Decisions](decisions/index.md)**: Architectural Decision Records (ADRs) and trade-offs.
* **[Case Histories](case-histories/index.md)**: Broken patterns, debugging postmortems, and breakthroughs.

See [log.md](log.md) for the dated record of changes.
`,
    });
    fs.writeFileSync(rootIndex, text, 'utf-8');
  }

  const logFile = path.join(bundleDir, 'log.md');
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(
      logFile,
      `# Knowledge Base Log

## ${new Date().toISOString().slice(0, 10)}
* Ingested precursor concepts from wiki-precursor into canonical OKF v0.2 layout.
`,
      'utf-8'
    );
  }
}
