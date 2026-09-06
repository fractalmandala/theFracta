import * as fs from 'node:fs';
import * as path from 'node:path';
import { SessionScanner } from './indexer/scanner.ts';
import { analyzeClusters, formatClusterSummaryMarkdown } from './clustering/cluster.ts';
import { scaffoldKnowledgeBundle } from './generator/scaffold.ts';
import { buildProgressiveIndexes } from './generator/index-builder.ts';
import { generateBundleVisualization } from './generator/visualizer.ts';
import { ingestPrecursorFiles } from './generator/precursor-ingest.ts';
import { lintOKFBundle } from './linter/validator.ts';
import { CatalogDatabase } from './indexer/catalog-db.ts';
import { KNOWN_SOURCES } from './indexer/sources-config.ts';

const HELP_TEXT = `
okf - Local-first Open Knowledge Format (OKF v0.2) Utility

Usage:
  okf <command> [options]

Commands:
  sources                   List all 19 supported local agent sources and status
  scan [options]            Index local agent sessions into local SQLite cache
  cluster [options]         Analyze indexed sessions & generate taxonomy recommendations
  init-concepts [options]   Scaffold initial OKF knowledge bundle & draft concepts
  ingest-precursor [opts]   Ingest & convert existing markdown files (e.g. wiki-precursor)
  index [options]           Regenerate hierarchical index.md navigation files
  viz [options]             Generate offline interactive graph viewer (viz.html)
  lint [options]            Validate OKF v0.2 frontmatter, schema, and cross-links
  status                    Show local catalog and knowledge bundle summary

Options:
  --db <path>               Path to local SQLite catalog (default: .okf-cache/catalog.db)
  --bundle <dir>            Path to OKF knowledge bundle (default: knowledge)
  --precursor <dir>         Path to precursor directory for ingestion
  --source <name>           Filter scan to specific agent source (e.g. claude, antigravity)
  --out <path>              Output file path for cluster summary or visualizer
  --help, -h                Show this help message
`;

export async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  const command = args[0];
  const parsedArgs = parseArgs(args.slice(1));

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    console.log(HELP_TEXT);
    return;
  }

  const dbPath = parsedArgs['--db'] || '.okf-cache/catalog.db';
  const bundleDir = parsedArgs['--bundle'] || 'knowledge';

  switch (command) {
    case 'sources': {
      console.log('\nSupported Local Agent Sources (19 total):\n');
      console.log('Name'.padEnd(20) + 'Format'.padEnd(15) + 'Default Path');
      console.log(''.padEnd(75, '-'));
      for (const s of KNOWN_SOURCES) {
        const homeResolved = s.defaultPath.replace(/^~/, process.env.HOME || '');
        const exists = fs.existsSync(homeResolved);
        const status = exists ? ' [FOUND]' : ' [not detected]';
        console.log(`${s.name.padEnd(20)}${s.format.padEnd(15)}${s.defaultPath}${status}`);
      }
      console.log('\nTo scan an active source: okf scan --source <name>');
      break;
    }

    case 'scan': {
      const sourceFilter = parsedArgs['--source'] ? [parsedArgs['--source']] : undefined;
      console.log(`\n🔍 Scanning local sessions (db: ${dbPath})...`);
      const scanner = new SessionScanner();
      const stats = await scanner.scanSources({
        dbPath,
        sourceFilter,
        onProgress: (rec) => {
          process.stdout.write(`\r[Scanned: ${rec.sourceAgent}] ${rec.titleOrFirstPrompt.slice(0, 50)}...`);
        },
      });
      process.stdout.write('\r' + ' '.repeat(80) + '\r');
      console.log(`\n✅ Scan complete in ${(stats.durationMs / 1000).toFixed(2)}s`);
      console.log(`Total sessions indexed: ${stats.totalScanned}`);
      for (const [src, count] of Object.entries(stats.bySource)) {
        if (count > 0) console.log(`  - ${src}: ${count} sessions`);
      }
      break;
    }

    case 'cluster': {
      console.log(`\n📊 Analyzing session clusters from ${dbPath}...`);
      const summary = analyzeClusters(dbPath);
      const outPath = parsedArgs['--out'] || '.okf-cache/cluster-summary.md';
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, formatClusterSummaryMarkdown(summary), 'utf-8');

      const jsonOut = outPath.replace(/\.md$/, '.json');
      fs.writeFileSync(jsonOut, JSON.stringify(summary, null, 2), 'utf-8');

      console.log(`✅ Cluster analysis complete:`);
      console.log(`  - Markdown report: ${outPath}`);
      console.log(`  - Structured JSON: ${jsonOut}`);
      console.log(`  - Detected Projects: ${summary.projects.length}`);
      console.log(`  - Detected Tech Domains: ${summary.technologies.length}`);
      console.log(`\nSuggested initial concepts ready for okf-head in: ${outPath}`);
      break;
    }

    case 'init-concepts': {
      console.log(`\n📁 Initializing OKF knowledge bundle at: ${bundleDir}...`);
      let summaryData;
      const summaryJsonPath = parsedArgs['--summary'] || '.okf-cache/cluster-summary.json';
      if (fs.existsSync(summaryJsonPath)) {
        try {
          summaryData = JSON.parse(fs.readFileSync(summaryJsonPath, 'utf-8'));
        } catch {
          // ignore
        }
      }

      const result = scaffoldKnowledgeBundle(bundleDir, summaryData);
      buildProgressiveIndexes(bundleDir);
      console.log(`✅ Scaffolding complete! Created/verified ${result.createdCount} documents.`);
      console.log(`Bundle ready at: ${path.resolve(bundleDir)}`);
      break;
    }

    case 'ingest-precursor': {
      const precursorDir = parsedArgs['--precursor'] || path.join(bundleDir, 'wiki-precursor');
      console.log(`\n📥 Ingesting precursor files from: ${precursorDir}`);
      console.log(`Target OKF bundle: ${path.resolve(bundleDir)}...`);

      const stats = ingestPrecursorFiles(precursorDir, bundleDir);
      console.log(`\n✅ Ingestion complete:`);
      console.log(`  - Total precursor files found: ${stats.totalFiles}`);
      console.log(`  - Successfully converted to OKF v0.2: ${stats.migratedCount}`);
      console.log(`\nBreakdown by Section:`);
      for (const [sec, count] of Object.entries(stats.bySection)) {
        console.log(`  - ${sec}/: ${count} concepts`);
      }
      console.log(`\nBreakdown by Type:`);
      for (const [t, count] of Object.entries(stats.byType)) {
        console.log(`  - ${t}: ${count}`);
      }

      console.log(`\n📑 Rebuilding progressive disclosure indexes...`);
      const idxRes = buildProgressiveIndexes(bundleDir);
      console.log(`  - Updated ${idxRes.updatedIndexes.length} index.md files.`);

      console.log(`\n🌐 Generating offline interactive visualizer...`);
      const vizRes = generateBundleVisualization(bundleDir, path.join(bundleDir, 'viz.html'));
      console.log(`  - Graph generated: ${vizRes.outputPath} (${vizRes.nodeCount} nodes, ${vizRes.edgeCount} edges)`);
      break;
    }

    case 'index': {
      console.log(`\n📑 Building progressive disclosure indexes for: ${bundleDir}...`);
      const result = buildProgressiveIndexes(bundleDir);
      console.log(`✅ Updated ${result.updatedIndexes.length} index.md files:`);
      for (const idx of result.updatedIndexes) {
        console.log(`  - ${idx}`);
      }
      break;
    }

    case 'viz': {
      const outHtml = parsedArgs['--out'] || path.join(bundleDir, 'viz.html');
      console.log(`\n🌐 Generating offline interactive visualizer for: ${bundleDir}...`);
      const result = generateBundleVisualization(bundleDir, outHtml);
      console.log(`✅ Visualization generated at: ${result.outputPath}`);
      console.log(`  - Nodes (Concepts): ${result.nodeCount}`);
      console.log(`  - Edges (Cross-links): ${result.edgeCount}`);
      console.log(`\nOpen locally in your browser: file://${result.outputPath}`);
      break;
    }

    case 'lint': {
      console.log(`\n🔎 Linting OKF bundle compliance: ${bundleDir}...`);
      const res = lintOKFBundle(bundleDir);
      console.log(`Inspected ${res.totalFiles} concepts:`);
      console.log(`Errors: ${res.errorCount} | Warnings: ${res.warningCount}\n`);

      for (const issue of res.issues) {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.conceptId}: ${issue.message}`);
      }

      if (res.errorCount === 0) {
        console.log('\n✅ Bundle passes OKF v0.2 specification checks!');
      } else {
        process.exitCode = 1;
      }
      break;
    }

    case 'status': {
      console.log('\n📦 OKF Local Utility Status\n');
      const catalogDb = new CatalogDatabase(dbPath);
      const sessCount = catalogDb.getSessionCount();
      catalogDb.close();

      console.log(`Local Session Cache: ${dbPath}`);
      console.log(`  - Total Indexed Sessions: ${sessCount}`);

      const bundleExists = fs.existsSync(bundleDir);
      console.log(`\nKnowledge Bundle: ${path.resolve(bundleDir)}`);
      if (bundleExists) {
        const lint = lintOKFBundle(bundleDir);
        console.log(`  - Total Concepts: ${lint.totalFiles}`);
        console.log(`  - Status: ${lint.errorCount === 0 ? 'HEALTHY' : 'NEEDS ATTENTION'}`);
      } else {
        console.log('  - Status: Not initialized yet (run: okf init-concepts)');
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}\nRun 'okf --help' for usage.`);
      process.exitCode = 1;
  }
}

function parseArgs(args: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        parsed[arg] = next;
        i++;
      } else {
        parsed[arg] = 'true';
      }
    }
  }
  return parsed;
}

if (process.argv[1] && process.argv[1].endsWith('cli.ts')) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
