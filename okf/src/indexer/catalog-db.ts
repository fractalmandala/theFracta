import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SessionRecord } from '../types.ts';

export class CatalogDatabase {
  private db: DatabaseSync;

  constructor(dbFilePath: string = '.okf-cache/catalog.db') {
    const fullPath = path.resolve(dbFilePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    this.db = new DatabaseSync(fullPath);
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        source_agent TEXT NOT NULL,
        raw_path TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        working_dir TEXT,
        title_prompt TEXT,
        files_json TEXT,
        artifacts_json TEXT,
        tech_tags_json TEXT,
        turn_count INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_source ON sessions(source_agent);
      CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON sessions(timestamp);
      CREATE INDEX IF NOT EXISTS idx_sessions_working_dir ON sessions(working_dir);

      CREATE TABLE IF NOT EXISTS concepts_map (
        concept_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        relevance_note TEXT,
        PRIMARY KEY (concept_id, session_id)
      );
    `);
  }

  insertSession(record: SessionRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sessions (
        id, source_agent, raw_path, timestamp, working_dir,
        title_prompt, files_json, artifacts_json, tech_tags_json, turn_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.id,
      record.sourceAgent,
      record.rawPath,
      record.timestamp,
      record.workingDirectory || '',
      record.titleOrFirstPrompt,
      JSON.stringify(record.filesTouched || []),
      JSON.stringify(record.artifactsCreated || []),
      JSON.stringify(record.techTags || []),
      record.turnCount || 0
    );
  }

  insertBatch(records: SessionRecord[]): void {
    this.db.exec('BEGIN TRANSACTION;');
    try {
      for (const rec of records) {
        this.insertSession(rec);
      }
      this.db.exec('COMMIT;');
    } catch (e) {
      this.db.exec('ROLLBACK;');
      throw e;
    }
  }

  getAllSessions(): SessionRecord[] {
    const rows = this.db.prepare(`
      SELECT id, source_agent, raw_path, timestamp, working_dir,
             title_prompt, files_json, artifacts_json, tech_tags_json, turn_count
      FROM sessions
      ORDER BY timestamp DESC
    `).all() as any[];

    return rows.map(r => ({
      id: r.id,
      sourceAgent: r.source_agent,
      rawPath: r.raw_path,
      timestamp: r.timestamp,
      workingDirectory: r.working_dir || undefined,
      titleOrFirstPrompt: r.title_prompt || '',
      filesTouched: JSON.parse(r.files_json || '[]'),
      artifactsCreated: JSON.parse(r.artifacts_json || '[]'),
      techTags: JSON.parse(r.tech_tags_json || '[]'),
      turnCount: r.turn_count || 0,
    }));
  }

  getSessionCount(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number };
    return row?.count || 0;
  }

  close(): void {
    this.db.close();
  }
}
