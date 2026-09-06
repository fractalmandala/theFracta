import { KNOWN_SOURCES } from './sources-config.ts';
import { CatalogDatabase } from './catalog-db.ts';
import { SQLiteAdapter } from '../adapters/sqlite.ts';
import { JSONLAdapter } from '../adapters/jsonl.ts';
import { SessionTreeAdapter } from '../adapters/session-tree.ts';
import { ArtifactsAdapter } from '../adapters/artifacts.ts';
import type { BaseAdapter, ParseOptions } from '../adapters/base.ts';
import type { SessionRecord, SourceDefinition } from '../types.ts';

export interface ScanStats {
  totalScanned: number;
  bySource: Record<string, number>;
  durationMs: number;
}

export class SessionScanner {
  private adapters: Map<string, BaseAdapter>;

  constructor() {
    this.adapters = new Map();
    const sqlite = new SQLiteAdapter();
    const jsonl = new JSONLAdapter();
    const tree = new SessionTreeAdapter();
    const artifacts = new ArtifactsAdapter();

    this.adapters.set('sqlite', sqlite);
    this.adapters.set('jsonl', jsonl);
    this.adapters.set('session-tree', tree);
    this.adapters.set('artifacts', artifacts);
  }

  async scanSources(
    options: {
      dbPath?: string;
      sourceFilter?: string[];
      parseOptions?: ParseOptions;
      onProgress?: (record: SessionRecord) => void;
    } = {}
  ): Promise<ScanStats> {
    const startTime = Date.now();
    const db = new CatalogDatabase(options.dbPath || '.okf-cache/catalog.db');
    const bySource: Record<string, number> = {};
    let totalScanned = 0;

    const sources = KNOWN_SOURCES.filter(s => {
      if (!s.enabled) return false;
      if (options.sourceFilter && options.sourceFilter.length > 0) {
        return options.sourceFilter.includes(s.name);
      }
      return true;
    });

    const batch: SessionRecord[] = [];
    const BATCH_SIZE = 100;

    for (const sourceDef of sources) {
      const adapter = this.adapters.get(sourceDef.format);
      if (!adapter) continue;

      let sourceCount = 0;
      try {
        for await (const record of adapter.parse(sourceDef, options.parseOptions)) {
          batch.push(record);
          sourceCount++;
          totalScanned++;

          if (options.onProgress) {
            options.onProgress(record);
          }

          if (batch.length >= BATCH_SIZE) {
            db.insertBatch(batch);
            batch.length = 0;
          }
        }
      } catch (err: any) {
        console.warn(`[Scanner] Warning scanning ${sourceDef.name}: ${err.message}`);
      }

      bySource[sourceDef.name] = sourceCount;
    }

    if (batch.length > 0) {
      db.insertBatch(batch);
    }

    db.close();

    return {
      totalScanned,
      bySource,
      durationMs: Date.now() - startTime,
    };
  }
}
