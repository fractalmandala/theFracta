import type { SessionRecord, SourceDefinition } from '../types.ts';

export interface ParseOptions {
  sinceDate?: Date;
  limit?: number;
  projectFilter?: string;
}

export abstract class BaseAdapter {
  abstract readonly name: string;
  abstract readonly supportedFormats: string[];

  /**
   * Scans the target path and yields normalized SessionRecords without
   * loading massive chat histories into memory.
   */
  abstract parse(
    sourceDef: SourceDefinition,
    options?: ParseOptions
  ): AsyncGenerator<SessionRecord, void, unknown>;

  /**
   * Reads the specific excerpt or details for a single session to support
   * downstream concept enrichment.
   */
  abstract getSessionContent(
    rawPath: string,
    sessionId: string
  ): Promise<{
    userPrompts: string[];
    assistantSnippets: string[];
    touchedFiles: string[];
  } | null>;
}
