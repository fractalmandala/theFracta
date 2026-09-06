import * as path from 'node:path';
import { CatalogDatabase } from '../indexer/catalog-db.ts';
import { detectTechnologies } from './tech-detect.ts';
import type { ClusterSummary, ProjectCluster, TechCluster, IntentCluster, SessionRecord } from '../types.ts';

export function analyzeClusters(dbPath: string = '.okf-cache/catalog.db'): ClusterSummary {
  const db = new CatalogDatabase(dbPath);
  const sessions = db.getAllSessions();
  db.close();

  const projectMap = new Map<string, {
    workingDirectory: string;
    sessions: SessionRecord[];
    techSet: Set<string>;
    sources: Set<string>;
    artifacts: Set<string>;
    prompts: string[];
  }>();

  const techMap = new Map<string, {
    count: number;
    files: Set<string>;
    prompts: string[];
  }>();

  const intents: Record<string, IntentCluster> = {
    'Scaffolding & Starters': { category: 'Scaffolding & Starters', prompts: [] },
    'UI & Components': { category: 'UI & Components', prompts: [] },
    'Debugging & Fixes': { category: 'Debugging & Fixes', prompts: [] },
    'Conventions & Rules': { category: 'Conventions & Rules', prompts: [] },
    'General': { category: 'General', prompts: [] },
  };

  for (const sess of sessions) {
    // Project aggregation
    const projKey = resolveProjectName(sess.workingDirectory, sess.rawPath);
    if (!projectMap.has(projKey)) {
      projectMap.set(projKey, {
        workingDirectory: sess.workingDirectory || '',
        sessions: [],
        techSet: new Set(),
        sources: new Set(),
        artifacts: new Set(),
        prompts: [],
      });
    }

    const pEntry = projectMap.get(projKey)!;
    pEntry.sessions.push(sess);
    pEntry.sources.add(sess.sourceAgent);
    for (const art of sess.artifactsCreated) pEntry.artifacts.add(art);
    if (sess.titleOrFirstPrompt) pEntry.prompts.push(sess.titleOrFirstPrompt);

    // Tech aggregation
    const allText = `${sess.titleOrFirstPrompt} ${sess.filesTouched.join(' ')} ${sess.techTags.join(' ')}`;
    const detectedTech = detectTechnologies(allText);
    for (const t of detectedTech) {
      pEntry.techSet.add(t);
      if (!techMap.has(t)) {
        techMap.set(t, { count: 0, files: new Set(), prompts: [] });
      }
      const tEntry = techMap.get(t)!;
      tEntry.count++;
      for (const f of sess.filesTouched) tEntry.files.add(f);
      if (tEntry.prompts.length < 5 && sess.titleOrFirstPrompt) {
        tEntry.prompts.push(sess.titleOrFirstPrompt);
      }
    }

    // Intent categorizer
    classifyIntent(sess, intents);
  }

  const projects: ProjectCluster[] = Array.from(projectMap.entries())
    .map(([name, data]) => ({
      name,
      workingDirectory: data.workingDirectory,
      sessionCount: data.sessions.length,
      sources: Array.from(data.sources),
      techStack: Array.from(data.techSet),
      keyPrompts: data.prompts.slice(0, 5),
      artifacts: Array.from(data.artifacts).slice(0, 5),
    }))
    .sort((a, b) => b.sessionCount - a.sessionCount);

  const technologies: TechCluster[] = Array.from(techMap.entries())
    .map(([tech, data]) => ({
      technology: tech,
      sessionCount: data.count,
      relatedFiles: Array.from(data.files).slice(0, 10),
      samplePrompts: data.prompts,
    }))
    .sort((a, b) => b.sessionCount - a.sessionCount);

  // Propose taxonomy based on mined clusters
  const suggestedTaxonomy = {
    coreConcepts: [
      'svelte-5-runes-reactive-patterns',
      'responsive-drawer-layout',
      'tauri-v2-desktop-scaffold',
      'indented-sass-styling-tokens',
      'cytoscape-graph-visualization',
      'sqlite-local-data-caching',
    ],
    projects: projects.slice(0, 10).map(p => slugify(p.name)),
    conventions: [
      'single-tab-indented-sass-rules',
      'svelte-zero-in-component-styles',
      'local-first-zero-cloud-philosophy',
      'okf-frontmatter-and-citation-standards',
    ],
    caseHistories: [
      'tauri-macos-permissions-debugging',
      'adk-to-local-okf-migration',
      'multi-agent-session-synthesis-breakthrough',
    ],
    glossary: [
      'open-knowledge-format-okf',
      'runes',
      'cytoscape-dagre',
      'progressive-disclosure',
    ],
  };

  return {
    generatedAt: new Date().toISOString(),
    totalSessionsIndexed: sessions.length,
    projects,
    technologies,
    intents,
    suggestedTaxonomy,
  };
}

function resolveProjectName(workingDir?: string, rawPath?: string): string {
  if (workingDir && workingDir !== '/' && !workingDir.endsWith('/projects')) {
    const base = path.basename(workingDir);
    if (base && !base.startsWith('.')) return base;
  }
  if (rawPath) {
    const parts = rawPath.split(path.sep);
    const projIdx = parts.lastIndexOf('projects');
    if (projIdx >= 0 && projIdx < parts.length - 1) {
      return parts[projIdx + 1];
    }
  }
  return 'general-workspace';
}

function classifyIntent(sess: SessionRecord, intents: Record<string, IntentCluster>) {
  const p = (sess.titleOrFirstPrompt || '').toLowerCase();

  if (p.includes('setup') || p.includes('how to start') || p.includes('init') || p.includes('scaffold') || p.includes('bootstrap')) {
    intents['Scaffolding & Starters'].prompts.push({ sessionId: sess.id, source: sess.sourceAgent, prompt: sess.titleOrFirstPrompt });
  } else if (p.includes('drawer') || p.includes('modal') || p.includes('sidebar') || p.includes('layout') || p.includes('component') || p.includes('ui')) {
    intents['UI & Components'].prompts.push({ sessionId: sess.id, source: sess.sourceAgent, prompt: sess.titleOrFirstPrompt });
  } else if (p.includes('error') || p.includes('fix') || p.includes('failed') || p.includes('bug') || p.includes('why does') || p.includes('debug')) {
    intents['Debugging & Fixes'].prompts.push({ sessionId: sess.id, source: sess.sourceAgent, prompt: sess.titleOrFirstPrompt });
  } else if (p.includes('rule') || p.includes('convention') || p.includes('style') || p.includes('prefer') || p.includes('standard')) {
    intents['Conventions & Rules'].prompts.push({ sessionId: sess.id, source: sess.sourceAgent, prompt: sess.titleOrFirstPrompt });
  } else {
    intents['General'].prompts.push({ sessionId: sess.id, source: sess.sourceAgent, prompt: sess.titleOrFirstPrompt });
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function formatClusterSummaryMarkdown(summary: ClusterSummary): string {
  return `# OKF Session Mining Cluster Summary

Generated: ${summary.generatedAt}
Total Sessions Indexed: ${summary.totalSessionsIndexed}

## 1. Top Detected Projects
${summary.projects.slice(0, 8).map(p => `* **${p.name}** (${p.sessionCount} sessions) — Tech: ${p.techStack.join(', ') || 'N/A'}`).join('\n')}

## 2. Top Technology Domains
${summary.technologies.slice(0, 8).map(t => `* **${t.technology}** (${t.sessionCount} sessions)`).join('\n')}

## 3. High-Signal Intent Signatures
* **Scaffolding & Starters**: ${summary.intents['Scaffolding & Starters']?.prompts.length || 0} sessions
* **UI & Component Recipes**: ${summary.intents['UI & Components']?.prompts.length || 0} sessions
* **Debugging & Problem Fixes**: ${summary.intents['Debugging & Fixes']?.prompts.length || 0} sessions
* **Conventions & Rules**: ${summary.intents['Conventions & Rules']?.prompts.length || 0} sessions

## 4. Suggested Initial Concepts Set for OKF
### Core Concepts (\`core-concepts/\`)
${summary.suggestedTaxonomy.coreConcepts.map(c => `* \`${c}.md\``).join('\n')}

### Projects (\`projects/\`)
${summary.suggestedTaxonomy.projects.map(p => `* \`${p}.md\``).join('\n')}

### Conventions (\`conventions/\`)
${summary.suggestedTaxonomy.conventions.map(c => `* \`${c}.md\``).join('\n')}

### Case Histories (\`case-histories/\`)
${summary.suggestedTaxonomy.caseHistories.map(ch => `* \`${ch}.md\``).join('\n')}
`;
}
