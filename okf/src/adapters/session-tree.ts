import * as fs from 'node:fs';
import * as path from 'node:path';
import { BaseAdapter, type ParseOptions } from './base.ts';
import type { SessionRecord, SourceDefinition } from '../types.ts';
import { inferTechTags } from './sqlite.ts';

export class SessionTreeAdapter extends BaseAdapter {
  readonly name = 'session-tree';
  readonly supportedFormats = ['session-tree'];

  async *parse(
    sourceDef: SourceDefinition,
    options?: ParseOptions
  ): AsyncGenerator<SessionRecord, void, unknown> {
    const rootPath = sourceDef.defaultPath.replace(/^~/, process.env.HOME || '');
    if (!fs.existsSync(rootPath)) return;

    try {
      const entries = fs.readdirSync(rootPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;

        const fullPath = path.join(rootPath, entry.name);
        if (entry.isDirectory()) {
          // Inspect session directory
          const record = this.inspectSessionDir(fullPath, entry.name, sourceDef.name);
          if (record) yield record;
        } else if (entry.isFile() && (entry.name.endsWith('.json') || entry.name.endsWith('.md'))) {
          // Individual session file
          const record = this.inspectSessionFile(fullPath, entry.name, sourceDef.name);
          if (record) yield record;
        }
      }
    } catch {
      // Ignore directory read errors
    }
  }

  private inspectSessionDir(dirPath: string, dirName: string, sourceName: string): SessionRecord | null {
    try {
      const stat = fs.statSync(dirPath);
      const subFiles = fs.readdirSync(dirPath).slice(0, 20);

      let firstPrompt = `${sourceName} session ${dirName}`;
      const artifacts: string[] = [];

      // Check for config, manifest, or session.json
      for (const file of subFiles) {
        if (file.endsWith('.md')) {
          artifacts.push(path.join(dirPath, file));
        }
        if (file === 'session.json' || file === 'meta.json' || file === 'info.json') {
          try {
            const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8');
            const data = JSON.parse(raw);
            if (data.title || data.prompt || data.name) {
              firstPrompt = data.title || data.prompt || data.name;
            }
          } catch {
            // ignore
          }
        }
      }

      return {
        id: `${sourceName}:${dirName}`,
        sourceAgent: sourceName,
        rawPath: dirPath,
        timestamp: stat.mtime.toISOString(),
        workingDirectory: dirPath,
        titleOrFirstPrompt: firstPrompt.slice(0, 300),
        filesTouched: [],
        artifactsCreated: artifacts,
        techTags: inferTechTags(firstPrompt, artifacts),
      };
    } catch {
      return null;
    }
  }

  private inspectSessionFile(filePath: string, fileName: string, sourceName: string): SessionRecord | null {
    try {
      const stat = fs.statSync(filePath);
      let prompt = `${sourceName} file ${fileName}`;

      if (fileName.endsWith('.json')) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          prompt = data.prompt || data.title || data.query || prompt;
        } catch {
          // ignore
        }
      }

      return {
        id: `${sourceName}:${path.basename(fileName, path.extname(fileName))}`,
        sourceAgent: sourceName,
        rawPath: filePath,
        timestamp: stat.mtime.toISOString(),
        workingDirectory: path.dirname(filePath),
        titleOrFirstPrompt: String(prompt).slice(0, 300),
        filesTouched: [],
        artifactsCreated: fileName.endsWith('.md') ? [filePath] : [],
        techTags: inferTechTags(prompt, [filePath]),
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
