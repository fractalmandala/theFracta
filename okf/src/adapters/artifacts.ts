import * as fs from 'node:fs';
import * as path from 'node:path';
import { BaseAdapter, type ParseOptions } from './base.ts';
import type { SessionRecord, SourceDefinition } from '../types.ts';
import { inferTechTags } from './sqlite.ts';

export class ArtifactsAdapter extends BaseAdapter {
  readonly name = 'artifacts';
  readonly supportedFormats = ['artifacts'];

  async *parse(
    sourceDef: SourceDefinition,
    options?: ParseOptions
  ): AsyncGenerator<SessionRecord, void, unknown> {
    const rootPath = sourceDef.defaultPath.replace(/^~/, process.env.HOME || '');
    if (!fs.existsSync(rootPath)) return;

    try {
      const brainDirs = fs.readdirSync(rootPath, { withFileTypes: true });

      for (const entry of brainDirs) {
        if (!entry.isDirectory()) continue;
        const brainUuid = entry.name;
        const dirPath = path.join(rootPath, brainUuid);

        const record = this.inspectBrainDir(dirPath, brainUuid);
        if (record) yield record;
      }
    } catch {
      // Ignore
    }
  }

  private inspectBrainDir(dirPath: string, uuid: string): SessionRecord | null {
    try {
      const stat = fs.statSync(dirPath);
      const files = fs.readdirSync(dirPath);
      const artifacts: string[] = [];
      let summaryTitle = `Antigravity Brain Artifacts (${uuid.slice(0, 8)})`;

      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (file.endsWith('.md')) {
          artifacts.push(fullPath);
          // Look for title header in implementation_plan.md or walkthrough.md
          if (file === 'implementation_plan.md' || file === 'walkthrough.md') {
            try {
              const head = fs.readFileSync(fullPath, 'utf-8').slice(0, 500);
              const titleMatch = head.match(/^#\s+(.+)$/m);
              if (titleMatch && titleMatch[1]) {
                summaryTitle = `${file === 'walkthrough.md' ? '[Walkthrough]' : '[Plan]'} ${titleMatch[1].trim()}`;
              }
            } catch {
              // ignore
            }
          }
        }
      }

      if (artifacts.length === 0) return null;

      return {
        id: `antigravity-brain:${uuid}`,
        sourceAgent: 'antigravity-artifacts',
        rawPath: dirPath,
        timestamp: stat.mtime.toISOString(),
        workingDirectory: dirPath,
        titleOrFirstPrompt: summaryTitle,
        filesTouched: [],
        artifactsCreated: artifacts,
        techTags: inferTechTags(summaryTitle, artifacts),
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
