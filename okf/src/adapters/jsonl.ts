import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { BaseAdapter, type ParseOptions } from './base.ts';
import type { SessionRecord, SourceDefinition } from '../types.ts';
import { inferTechTags } from './sqlite.ts';

export class JSONLAdapter extends BaseAdapter {
  readonly name = 'jsonl';
  readonly supportedFormats = ['jsonl'];

  async *parse(
    sourceDef: SourceDefinition,
    options?: ParseOptions
  ): AsyncGenerator<SessionRecord, void, unknown> {
    const rootPath = sourceDef.defaultPath.replace(/^~/, process.env.HOME || '');
    if (!fs.existsSync(rootPath)) return;

    // Fast recursive file locator for .jsonl files
    const jsonlFiles = this.findJsonlFiles(rootPath);

    for (const filePath of jsonlFiles) {
      const record = await this.inspectJsonlHeader(filePath, sourceDef.name);
      if (record) {
        yield record;
      }
    }
  }

  private findJsonlFiles(dir: string, maxDepth: number = 6): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const walk = (current: string, depth: number) => {
      if (depth > maxDepth) return;
      try {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(current, entry.name);
          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.git') && entry.name !== 'node_modules') {
              walk(full, depth + 1);
            }
          } else if (entry.isFile() && (entry.name.endsWith('.jsonl') || entry.name.endsWith('.json'))) {
            results.push(full);
          }
        }
      } catch {
        // Skip inaccessible dirs
      }
    };

    walk(dir, 0);
    return results;
  }

  private async inspectJsonlHeader(filePath: string, sourceName: string): Promise<SessionRecord | null> {
    try {
      const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let firstPrompt = '';
      let workingDir = '';
      let timestamp = '';
      const filesTouched = new Set<string>();
      let lineCount = 0;

      for await (const line of rl) {
        lineCount++;
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const obj = JSON.parse(trimmed);

          // Capture timestamp from first valid entry
          if (!timestamp) {
            timestamp = obj.timestamp || obj.created_at || obj.time || '';
          }

          // Capture working directory if present
          if (!workingDir) {
            workingDir = obj.cwd || obj.working_dir || obj.workingDirectory || '';
          }

          // Look for initial user message or query
          if (!firstPrompt) {
            if (obj.type === 'USER_INPUT' || obj.role === 'user' || obj.type === 'human') {
              firstPrompt = obj.content || obj.text || (typeof obj.message === 'string' ? obj.message : '');
            } else if (obj.prompt) {
              firstPrompt = String(obj.prompt);
            }
          }

          // Look for files touched in tool calls
          const toolCall = obj.tool_calls || obj.tool_call || obj.tool;
          if (toolCall) {
            const toolStr = JSON.stringify(toolCall);
            const pathMatches = toolStr.match(/(?:file|path|TargetFile)["']?\s*:\s*["']([^"']+)["']/g);
            if (pathMatches) {
              for (const pm of pathMatches) {
                const clean = pm.split(':')[1]?.replace(/["'\s]/g, '');
                if (clean) filesTouched.add(clean);
              }
            }
          }

          // Only scan the first 25 lines to keep indexing sub-millisecond per file
          if (lineCount > 25 && firstPrompt) {
            break;
          }
        } catch {
          // ignore malformed lines
        }
      }

      fileStream.close();

      const stat = fs.statSync(filePath);
      const mtime = stat.mtime.toISOString();
      const sessionId = path.basename(filePath, path.extname(filePath));

      return {
        id: `${sourceName}:${sessionId}`,
        sourceAgent: sourceName,
        rawPath: filePath,
        timestamp: timestamp || mtime,
        workingDirectory: workingDir || path.dirname(filePath),
        titleOrFirstPrompt: firstPrompt.slice(0, 300) || `${sourceName} session ${sessionId}`,
        filesTouched: Array.from(filesTouched),
        artifactsCreated: [],
        techTags: inferTechTags(firstPrompt, Array.from(filesTouched)),
        turnCount: lineCount,
      };
    } catch {
      return null;
    }
  }

  async getSessionContent(rawPath: string, sessionId: string) {
    return {
      userPrompts: [],
      assistantSnippets: [],
      touchedFiles: [],
    };
  }
}
