export interface TechPattern {
  name: string;
  category: 'frontend' | 'desktop' | 'styling' | 'backend' | 'database' | 'tooling';
  matchers: Array<string | RegExp>;
}

export const TECH_PATTERNS: TechPattern[] = [
  {
    name: 'SvelteKit 5',
    category: 'frontend',
    matchers: ['svelte', '.svelte', '$state', '$derived', '$props', '$effect', 'sveltekit'],
  },
  {
    name: 'Tauri v2',
    category: 'desktop',
    matchers: ['tauri', 'tauri.conf.json', 'src-tauri', '@tauri-apps'],
  },
  {
    name: 'Indented Sass',
    category: 'styling',
    matchers: ['.sass', 'sass-loader', 'indentedSyntax', 'sass:math'],
  },
  {
    name: 'Cytoscape.js',
    category: 'frontend',
    matchers: ['cytoscape', 'cola', 'dagre', 'graph-view', 'graph viewer'],
  },
  {
    name: 'Rust',
    category: 'backend',
    matchers: ['.rs', 'Cargo.toml', 'rustc', 'cargo'],
  },
  {
    name: 'SQLite / DuckDB',
    category: 'database',
    matchers: ['.sqlite', '.db', 'duckdb', 'better-sqlite3', 'node:sqlite'],
  },
  {
    name: 'Open Knowledge Format (OKF)',
    category: 'tooling',
    matchers: ['okf', 'knowledge-catalog', 'bundle', 'SPEC.md', 'concept_id'],
  },
  {
    name: 'Tailwind CSS',
    category: 'styling',
    matchers: ['tailwind', 'tailwind.config', '@apply'],
  },
  {
    name: 'Python',
    category: 'backend',
    matchers: ['.py', 'pyproject.toml', 'requirements.txt', 'pytest'],
  },
];

export function detectTechnologies(haystack: string): string[] {
  const lower = haystack.toLowerCase();
  const detected: string[] = [];

  for (const tech of TECH_PATTERNS) {
    for (const matcher of tech.matchers) {
      if (typeof matcher === 'string') {
        if (lower.includes(matcher.toLowerCase())) {
          detected.push(tech.name);
          break;
        }
      } else if (matcher.test(haystack)) {
        detected.push(tech.name);
        break;
      }
    }
  }

  return detected;
}
