/**
 * Core types for Open Knowledge Format (OKF v0.2) and the Local Session Mining Framework.
 */

export type ConceptType =
  | 'Concept'
  | 'Project'
  | 'Convention'
  | 'Case History'
  | 'Glossary Term'
  | 'Reference'
  | string;

export interface OKFSource {
  id: string;
  title: string;
  reference: string;
  author?: string;
  timestamp?: string;
}

export interface OKFFronmatter {
  type: ConceptType;
  title?: string;
  description?: string;
  status?: 'draft' | 'stable' | 'deprecated';
  tags?: string[];
  sources?: OKFSource[];
  generated?: {
    by?: string;
    at?: string;
  };
  verified?: Array<{
    by?: string;
    at?: string;
  }>;
  stale_after?: string;
  resource?: string;
  [key: string]: unknown;
}

export interface OKFConcept {
  id: string; // Relative path without .md (e.g. "core-concepts/responsive-drawer")
  filePath: string;
  frontmatter: OKFFronmatter;
  body: string;
  linksTo?: string[];
}

export interface SessionRecord {
  id: string;                  // Unique identifier (e.g., "claude:session-123")
  sourceAgent: string;         // Tool name (e.g., "claude", "antigravity", "opencode")
  rawPath: string;             // File or database path on host
  timestamp: string;           // ISO 8601 string
  workingDirectory?: string;   // Project workspace path if known
  titleOrFirstPrompt: string;  // Initial user prompt or session title
  filesTouched: string[];      // Source code files read or written
  artifactsCreated: string[];  // Markdown docs, specs, plans generated
  techTags: string[];          // Detected tech stack keywords (e.g. "sveltekit", "tauri")
  turnCount?: number;          // Total message turns
}

export interface SourceDefinition {
  name: string;
  displayName: string;
  defaultPath: string;
  format: 'sqlite' | 'jsonl' | 'session-tree' | 'artifacts' | 'custom';
  description: string;
  enabled: boolean;
}

export interface ProjectCluster {
  name: string;
  workingDirectory: string;
  sessionCount: number;
  sources: string[];
  techStack: string[];
  keyPrompts: string[];
  artifacts: string[];
}

export interface TechCluster {
  technology: string;
  sessionCount: number;
  relatedFiles: string[];
  samplePrompts: string[];
}

export interface IntentCluster {
  category: 'Scaffolding & Starters' | 'UI & Components' | 'Debugging & Fixes' | 'Conventions & Rules' | 'General';
  prompts: Array<{
    sessionId: string;
    source: string;
    prompt: string;
  }>;
}

export interface ClusterSummary {
  generatedAt: string;
  totalSessionsIndexed: number;
  projects: ProjectCluster[];
  technologies: TechCluster[];
  intents: Record<string, IntentCluster>;
  suggestedTaxonomy: {
    coreConcepts: string[];
    projects: string[];
    conventions: string[];
    caseHistories: string[];
    glossary: string[];
  };
}
