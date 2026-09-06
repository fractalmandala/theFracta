import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { BaseAdapter, type ParseOptions } from './base.ts';
import type { SessionRecord, SourceDefinition } from '../types.ts';

export class SQLiteAdapter extends BaseAdapter {
  readonly name = 'sqlite';
  readonly supportedFormats = ['sqlite'];

  async *parse(
    sourceDef: SourceDefinition,
    options?: ParseOptions
  ): AsyncGenerator<SessionRecord, void, unknown> {
    const rootPath = sourceDef.defaultPath.replace(/^~/, process.env.HOME || '');

    if (!fs.existsSync(rootPath)) {
      return;
    }

    if (sourceDef.name === 'opencode') {
      yield* this.parseOpenCode(rootPath, sourceDef, options);
    } else if (sourceDef.name === 'antigravity') {
      yield* this.parseAntigravity(rootPath, sourceDef, options);
    } else if (sourceDef.name === 'antigravity-cli') {
      yield* this.parseAntigravityCli(rootPath, sourceDef, options);
    }
  }

  private *parseOpenCode(
    dbPath: string,
    sourceDef: SourceDefinition,
    options?: ParseOptions
  ): Generator<SessionRecord, void, unknown> {
    if (!fs.existsSync(dbPath)) return;

    let db: DatabaseSync | null = null;
    try {
      db = new DatabaseSync(dbPath, { readOnly: true });

      // Check if session table exists
      const sessionTableCheck = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='session'")
        .get() as { name: string } | undefined;

      if (sessionTableCheck) {
        const rows = db.prepare(`
          SELECT s.id, s.title, s.directory, s.agent, s.model, s.time_created,
                 p.name as project_name, p.worktree,
                 (SELECT prompt FROM session_input WHERE session_id = s.id ORDER BY time_created ASC LIMIT 1) as first_prompt
          FROM session s
          LEFT JOIN project p ON s.project_id = p.id
          ORDER BY s.time_created DESC
        `).all() as any[];

        for (const row of rows) {
          const timestamp = row.time_created ? new Date(row.time_created).toISOString() : new Date().toISOString();
          const titleOrPrompt = row.first_prompt || row.title || `OpenCode session ${row.id}`;
          const workDir = row.directory || row.worktree || undefined;

          yield {
            id: `opencode:${row.id}`,
            sourceAgent: 'opencode',
            rawPath: dbPath,
            timestamp,
            workingDirectory: workDir,
            titleOrFirstPrompt: titleOrPrompt.slice(0, 300),
            filesTouched: [],
            artifactsCreated: [],
            techTags: inferTechTags(titleOrPrompt, workDir ? [workDir] : []),
          };
        }
        return;
      }
    } catch (err: any) {
      console.warn(`[SQLiteAdapter] Failed reading OpenCode db: ${err.message}`);
    } finally {
      db?.close();
    }
  }

  private *parseAntigravity(
    conversationsDir: string,
    sourceDef: SourceDefinition,
    options?: ParseOptions
  ): Generator<SessionRecord, void, unknown> {
    const dir = fs.statSync(conversationsDir).isDirectory() 
      ? conversationsDir 
      : path.dirname(conversationsDir);

    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.db'));
    for (const file of files) {
      const dbPath = path.join(dir, file);
      const uuid = path.basename(file, '.db');
      let db: DatabaseSync | null = null;
      try {
        db = new DatabaseSync(dbPath, { readOnly: true });
        
        // Scan turns/messages if available
        let firstPrompt = `Antigravity session ${uuid}`;
        let timestamp = new Date(fs.statSync(dbPath).mtime).toISOString();
        const filesTouched = new Set<string>();

        // Look for artifacts in accompanying brain directory
        const brainDir = path.join(path.dirname(dir), 'brain', uuid);
        const artifacts: string[] = [];
        if (fs.existsSync(brainDir)) {
          const brainFiles = fs.readdirSync(brainDir).filter(f => f.endsWith('.md'));
          artifacts.push(...brainFiles.map(bf => path.join(brainDir, bf)));
        }

        yield {
          id: `antigravity:${uuid}`,
          sourceAgent: 'antigravity',
          rawPath: dbPath,
          timestamp,
          titleOrFirstPrompt: firstPrompt,
          filesTouched: Array.from(filesTouched),
          artifactsCreated: artifacts,
          techTags: inferTechTags(firstPrompt, artifacts),
        };
      } catch (err: any) {
        // Skip inaccessible or locked db
      } finally {
        db?.close();
      }
    }
  }

  private *parseAntigravityCli(
    cliDir: string,
    sourceDef: SourceDefinition,
    options?: ParseOptions
  ): Generator<SessionRecord, void, unknown> {
    if (!fs.existsSync(cliDir)) return;
    const dbFiles = fs.readdirSync(cliDir).filter(f => f.endsWith('.db'));
    for (const file of dbFiles) {
      const dbPath = path.join(cliDir, file);
      const mtime = fs.statSync(dbPath).mtime.toISOString();
      yield {
        id: `antigravity-cli:${path.basename(file, '.db')}`,
        sourceAgent: 'antigravity-cli',
        rawPath: dbPath,
        timestamp: mtime,
        titleOrFirstPrompt: `Antigravity CLI run (${file})`,
        filesTouched: [],
        artifactsCreated: [],
        techTags: [],
      };
    }
  }

  async getSessionContent(rawPath: string, sessionId: string) {
    // Specific session reader for enrichment
    return {
      userPrompts: [],
      assistantSnippets: [],
      touchedFiles: [],
    };
  }
}

export function inferTechTags(promptText: string, files: string[]): string[] {
  const haystack = `${promptText} ${files.join(' ')}`.toLowerCase();
  const tags: string[] = [];

  if (haystack.includes('svelte') || haystack.includes('.svelte')) tags.push('sveltekit');
  if (haystack.includes('tauri') || haystack.includes('tauri.conf.json')) tags.push('tauri');
  if (haystack.includes('sass') || haystack.includes('.sass') || haystack.includes('.scss')) tags.push('sass');
  if (haystack.includes('sqlite') || haystack.includes('.db') || haystack.includes('.sqlite')) tags.push('sqlite');
  if (haystack.includes('cytoscape') || haystack.includes('graph')) tags.push('cytoscape');
  if (haystack.includes('rust') || haystack.includes('.rs')) tags.push('rust');
  if (haystack.includes('python') || haystack.includes('.py')) tags.push('python');
  if (haystack.includes('duckdb')) tags.push('duckdb');
  if (haystack.includes('tailwind')) tags.push('tailwind');
  if (haystack.includes('drawer')) tags.push('drawer-ui');

  return Array.from(new Set(tags));
}
