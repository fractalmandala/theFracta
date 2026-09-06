import type { OKFConcept, OKFFronmatter } from '../types.ts';

const FRONTMATTER_DELIMITER = '---';

/**
 * Simple, zero-dependency YAML frontmatter parser tailored for OKF documents.
 * Safely parses strings, numbers, booleans, lists, and key-value maps.
 */
export function parseYamlFrontmatter(yamlText: string): OKFFronmatter {
  const result: Record<string, unknown> = {};
  const lines = yamlText.split('\n');
  let topKey: string | null = null;
  let currentList: any[] | null = null;
  let currentMapInList: Record<string, unknown> | null = null;

  for (const rawLine of lines) {
    const commentIdx = rawLine.indexOf('#');
    const line = commentIdx >= 0 ? rawLine.slice(0, commentIdx) : rawLine;
    if (!line.trim()) continue;

    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Top-level line (indent === 0)
    if (indent === 0) {
      currentMapInList = null;
      currentList = null;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx > 0) {
        topKey = trimmed.slice(0, colonIdx).trim();
        const rawVal = trimmed.slice(colonIdx + 1).trim();
        if (!rawVal) {
          // Will be populated by subsequent indented lines
          result[topKey] = null;
        } else if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
          const inner = rawVal.slice(1, -1).trim();
          result[topKey] = inner ? inner.split(',').map(s => parsePrimitive(s.trim())) : [];
        } else {
          result[topKey] = parsePrimitive(rawVal);
        }
      }
      continue;
    }

    // Indented lines (indent > 0) under topKey
    if (topKey) {
      if (trimmed.startsWith('- ')) {
        const itemContent = trimmed.slice(2).trim();
        if (!Array.isArray(result[topKey])) {
          result[topKey] = [];
        }
        currentList = result[topKey] as any[];

        const colonIdx = itemContent.indexOf(':');
        if (colonIdx > 0) {
          // List item is a mapping, e.g. - id: "foo"
          const subKey = itemContent.slice(0, colonIdx).trim();
          const subVal = parsePrimitive(itemContent.slice(colonIdx + 1).trim());
          currentMapInList = { [subKey]: subVal };
          currentList.push(currentMapInList);
        } else {
          currentMapInList = null;
          currentList.push(parsePrimitive(itemContent));
        }
      } else {
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx > 0) {
          const subKey = trimmed.slice(0, colonIdx).trim();
          const subVal = parsePrimitive(trimmed.slice(colonIdx + 1).trim());

          if (currentMapInList) {
            currentMapInList[subKey] = subVal;
          } else {
            if (!result[topKey] || typeof result[topKey] !== 'object' || Array.isArray(result[topKey])) {
              result[topKey] = {};
            }
            (result[topKey] as Record<string, unknown>)[subKey] = subVal;
          }
        }
      }
    }
  }

  if (!result.type) {
    result.type = 'Concept';
  }

  return result as unknown as OKFFronmatter;
}

function parsePrimitive(val: string): unknown {
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  if (val.toLowerCase() === 'true') return true;
  if (val.toLowerCase() === 'false') return false;
  if (val.toLowerCase() === 'null') return null;
  const num = Number(val);
  if (!isNaN(num) && val !== '') return num;
  return val;
}

/**
 * Parses a markdown file with optional YAML frontmatter into an OKFConcept structure.
 */
export function parseOKFDocument(id: string, filePath: string, content: string): OKFConcept {
  const lines = content.split('\n');
  if (lines.length > 0 && lines[0].trim() === FRONTMATTER_DELIMITER) {
    let endIdx = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === FRONTMATTER_DELIMITER) {
        endIdx = i;
        break;
      }
    }

    if (endIdx > 0) {
      const fmText = lines.slice(1, endIdx).join('\n');
      const body = lines.slice(endIdx + 1).join('\n').replace(/^\n+/, '');
      const frontmatter = parseYamlFrontmatter(fmText);
      const linksTo = extractMarkdownLinks(body);
      return { id, filePath, frontmatter, body, linksTo };
    }
  }

  return {
    id,
    filePath,
    frontmatter: { type: 'Concept', title: id },
    body: content,
    linksTo: extractMarkdownLinks(content),
  };
}

/**
 * Serializes frontmatter and body into an OKF v0.2 markdown file.
 */
export function serializeOKFDocument(concept: { frontmatter: OKFFronmatter; body: string }): string {
  const { frontmatter, body } = concept;
  const lines: string[] = [FRONTMATTER_DELIMITER];

  // Required key first
  lines.push(`type: ${frontmatter.type || 'Concept'}`);
  if (frontmatter.title) lines.push(`title: "${escapeQuotes(frontmatter.title)}"`);
  if (frontmatter.description) lines.push(`description: "${escapeQuotes(frontmatter.description)}"`);
  if (frontmatter.status) lines.push(`status: ${frontmatter.status}`);

  if (frontmatter.tags && frontmatter.tags.length > 0) {
    lines.push('tags:');
    for (const tag of frontmatter.tags) {
      lines.push(`  - ${tag}`);
    }
  }

  if (frontmatter.sources && frontmatter.sources.length > 0) {
    lines.push('sources:');
    for (const src of frontmatter.sources) {
      lines.push(`  - id: "${escapeQuotes(src.id)}"`);
      lines.push(`    title: "${escapeQuotes(src.title)}"`);
      lines.push(`    reference: "${escapeQuotes(src.reference)}"`);
      if (src.timestamp) lines.push(`    timestamp: "${src.timestamp}"`);
    }
  }

  if (frontmatter.generated) {
    lines.push('generated:');
    if (frontmatter.generated.by) lines.push(`  by: "${frontmatter.generated.by}"`);
    if (frontmatter.generated.at) lines.push(`  at: "${frontmatter.generated.at}"`);
  }

  lines.push(FRONTMATTER_DELIMITER);
  lines.push('');
  lines.push(body.trim());
  lines.push('');

  return lines.join('\n');
}

function escapeQuotes(str: string): string {
  return str.replace(/"/g, '\\"');
}

export function extractMarkdownLinks(body: string): string[] {
  const linkRegex = /\]\(([^)\s]+\.md)(?:#[A-Za-z0-9_\-]*)?\)/g;
  const links: string[] = [];
  let match;
  while ((match = linkRegex.exec(body)) !== null) {
    const target = match[1];
    if (!target.includes('://') && !target.startsWith('/')) {
      links.push(target.replace(/\.md$/, ''));
    }
  }
  return Array.from(new Set(links));
}
