import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseOKFDocument } from '../core/document.ts';
import type { OKFConcept } from '../types.ts';

export interface LintIssue {
  filePath: string;
  conceptId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface LintResult {
  totalFiles: number;
  errorCount: number;
  warningCount: number;
  issues: LintIssue[];
}

export function lintOKFBundle(bundleDir: string = 'knowledge'): LintResult {
  const root = path.resolve(bundleDir);
  if (!fs.existsSync(root)) {
    return {
      totalFiles: 0,
      errorCount: 1,
      warningCount: 0,
      issues: [{ filePath: bundleDir, conceptId: 'root', severity: 'error', message: 'Bundle directory does not exist' }],
    };
  }

  const issues: LintIssue[] = [];
  const conceptMap = new Map<string, OKFConcept>();

  // Walk and parse
  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'wiki-precursor') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile() && e.name.endsWith('.md')) {
        const rel = path.relative(root, full).replace(/\.md$/, '');
        try {
          const content = fs.readFileSync(full, 'utf-8');
          const doc = parseOKFDocument(rel, full, content);
          conceptMap.set(rel, doc);
        } catch (err: any) {
          issues.push({
            filePath: full,
            conceptId: rel,
            severity: 'error',
            message: `Failed parsing frontmatter: ${err.message}`,
          });
        }
      }
    }
  };

  walk(root);

  // Validate compliance and cross-links
  for (const [relId, concept] of conceptMap.entries()) {
    const fm = concept.frontmatter;

    // OKF v0.2 §11: 'type' is required
    if (!fm.type) {
      issues.push({
        filePath: concept.filePath,
        conceptId: relId,
        severity: 'error',
        message: "Missing required frontmatter key: 'type'",
      });
    }

    // Title check
    if (!fm.title && relId !== 'index') {
      issues.push({
        filePath: concept.filePath,
        conceptId: relId,
        severity: 'warning',
        message: "Missing recommended frontmatter key: 'title'",
      });
    }

    // Staleness check
    if (fm.stale_after) {
      const expiry = new Date(fm.stale_after);
      if (!isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
        issues.push({
          filePath: concept.filePath,
          conceptId: relId,
          severity: 'warning',
          message: `Concept expired on ${fm.stale_after} (marked stale)`,
        });
      }
    }

    // Check cross-links
    if (concept.linksTo) {
      const docDir = path.dirname(concept.filePath);
      for (const target of concept.linksTo) {
        const targetRel = path.normalize(path.join(path.dirname(relId), target));
        const targetPathWithMd = path.join(docDir, `${target}.md`);
        const targetPathIndex = path.join(docDir, target, 'index.md');

        if (!conceptMap.has(targetRel) && !fs.existsSync(targetPathWithMd) && !fs.existsSync(targetPathIndex)) {
          issues.push({
            filePath: concept.filePath,
            conceptId: relId,
            severity: 'warning',
            message: `Broken internal link to: [${target}]`,
          });
        }
      }
    }
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return {
    totalFiles: conceptMap.size,
    errorCount,
    warningCount,
    issues,
  };
}
