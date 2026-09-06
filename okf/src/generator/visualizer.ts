import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseOKFDocument } from '../core/document.ts';
import type { OKFConcept } from '../types.ts';

const TYPE_COLORS: Record<string, string> = {
  Concept: '#3b82f6', // blue
  Project: '#8b5cf6', // purple
  Convention: '#10b981', // emerald
  'Case History': '#f59e0b', // amber
  'Glossary Term': '#ec4899', // pink
  Reference: '#06b6d4', // cyan
  'Directory Index': '#64748b', // slate
  'Bundle Index': '#0f172a', // dark slate
};

export function generateBundleVisualization(
  bundleDir: string = 'knowledge',
  outputHtmlPath?: string
): { nodeCount: number; edgeCount: number; outputPath: string } {
  const root = path.resolve(bundleDir);
  const outPath = outputHtmlPath ? path.resolve(outputHtmlPath) : path.join(root, 'viz.html');

  const concepts: OKFConcept[] = [];

  // Recursive walk
  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'wiki-precursor') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile() && e.name.endsWith('.md')) {
        const rel = path.relative(root, full).replace(/\.md$/, '');
        const content = fs.readFileSync(full, 'utf-8');
        concepts.push(parseOKFDocument(rel, full, content));
      }
    }
  };

  walk(root);

  // Build Cytoscape graph nodes and edges
  const nodes = concepts.map(c => {
    const type = c.frontmatter.type || 'Concept';
    const color = TYPE_COLORS[type] || '#94a3b8';
    return {
      data: {
        id: c.id,
        label: c.frontmatter.title || c.id,
        type: type,
        description: c.frontmatter.description || '',
        tags: c.frontmatter.tags || [],
        status: c.frontmatter.status || 'stable',
        sources: c.frontmatter.sources || [],
        body: c.body,
        color: color,
        size: 28 + Math.min(40, Math.floor(c.body.length / 100)),
      },
    };
  });

  const nodeSet = new Set(concepts.map(c => c.id));
  const edges: any[] = [];
  let edgeId = 0;

  for (const c of concepts) {
    if (!c.linksTo) continue;
    for (const target of c.linksTo) {
      // Resolve relative target to bundle root
      const docDir = path.dirname(c.id);
      const normalizedTarget = path.normalize(path.join(docDir, target));

      if (nodeSet.has(normalizedTarget) && normalizedTarget !== c.id) {
        edgeId++;
        edges.push({
          data: {
            id: `e_${edgeId}`,
            source: c.id,
            target: normalizedTarget,
          },
        });
      }
    }
  }

  const html = buildHtmlTemplate(path.basename(root), nodes, edges);
  fs.writeFileSync(outPath, html, 'utf-8');

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    outputPath: outPath,
  };
}

function buildHtmlTemplate(bundleName: string, nodes: any[], edges: any[]): string {
  const dataJson = JSON.stringify({ nodes, edges });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bundleName} - OKF Interactive Knowledge Graph</title>
  <script src="https://cdn.jsdelivr.net/npm/cytoscape@3.28.1/dist/cytoscape.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dagre@0.8.5/dist/dagre.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/cytoscape-dagre@2.5.0/cytoscape-dagre.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif; display: flex; height: 100vh; background: #0f172a; color: #f8fafc; overflow: hidden; }
    #sidebar { width: 380px; height: 100%; background: #1e293b; border-right: 1px solid #334155; display: flex; flex-direction: column; z-index: 10; }
    #header { padding: 18px 20px; border-bottom: 1px solid #334155; }
    #header h1 { font-size: 1.1rem; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 8px; }
    #header p { font-size: 0.8rem; color: #94a3b8; margin-top: 4px; }
    #search-box { padding: 12px 20px; border-bottom: 1px solid #334155; }
    #search { width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: #f8fafc; font-size: 0.85rem; outline: none; }
    #search:focus { border-color: #3b82f6; }
    #details { flex: 1; padding: 20px; overflow-y: auto; font-size: 0.88rem; line-height: 1.5; }
    #details h2 { font-size: 1.15rem; margin-bottom: 6px; color: #60a5fa; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 6px; margin-bottom: 8px; }
    .tag { background: #334155; color: #cbd5e1; display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-right: 4px; margin-bottom: 4px; }
    .meta-group { margin-top: 12px; margin-bottom: 16px; border-top: 1px solid #334155; padding-top: 10px; }
    .meta-label { font-size: 0.72rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
    #details pre { background: #0f172a; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 0.8rem; border: 1px solid #334155; margin-top: 10px; white-space: pre-wrap; word-break: break-word; }
    #graph-container { flex: 1; height: 100%; position: relative; }
    #cy { width: 100%; height: 100%; }
    #legend { position: absolute; bottom: 20px; right: 20px; background: rgba(30, 41, 59, 0.9); padding: 12px 16px; border-radius: 8px; border: 1px solid #334155; font-size: 0.75rem; }
    .legend-item { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .legend-color { width: 12px; height: 12px; border-radius: 3px; }
  </style>
</head>
<body>
  <div id="sidebar">
    <div id="header">
      <h1>🌐 OKF Knowledge Graph</h1>
      <p>${bundleName} &bull; Mined & Synthesized</p>
    </div>
    <div id="search-box">
      <input type="text" id="search" placeholder="Search concepts, tags, or topics..." />
    </div>
    <div id="details">
      <p style="color: #94a3b8; font-style: italic;">Select any concept node in the graph to view its metadata, synthesized documentation, and citations.</p>
    </div>
  </div>

  <div id="graph-container">
    <div id="cy"></div>
    <div id="legend">
      <div class="legend-item"><span class="legend-color" style="background:#3b82f6"></span> Concept</div>
      <div class="legend-item"><span class="legend-color" style="background:#8b5cf6"></span> Project</div>
      <div class="legend-item"><span class="legend-color" style="background:#10b981"></span> Convention</div>
      <div class="legend-item"><span class="legend-color" style="background:#f59e0b"></span> Case History</div>
      <div class="legend-item"><span class="legend-color" style="background:#ec4899"></span> Glossary</div>
    </div>
  </div>

  <script>
    const graphData = ${dataJson};

    const cy = cytoscape({
      container: document.getElementById('cy'),
      elements: [...graphData.nodes, ...graphData.edges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-size': '11px',
            'font-weight': '500',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'width': 'data(size)',
            'height': 'data(size)',
            'border-width': 2,
            'border-color': '#0f172a'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.7
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#ffffff',
            'shadow-blur': 12,
            'shadow-color': '#60a5fa',
            'shadow-opacity': 0.8
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        padding: 50,
        componentSpacing: 80,
        nodeOverlap: 20
      }
    });

    const detailsEl = document.getElementById('details');

    cy.on('tap', 'node', function(evt) {
      const d = evt.target.data();
      renderDetails(d);
    });

    function renderDetails(d) {
      const tagsHtml = (d.tags || []).map(t => '<span class="tag">#' + escapeHtml(t) + '</span>').join('');
      const sourcesHtml = (d.sources || []).map(s => '<li><strong>' + escapeHtml(s.title || s.id) + '</strong> (' + escapeHtml(s.reference || '') + ')</li>').join('');

      detailsEl.innerHTML = \`
        <h2>\${escapeHtml(d.label)}</h2>
        <span class="badge" style="background:\${d.color}; color:#fff">\${escapeHtml(d.type)}</span>
        <span class="badge" style="background:#334155; color:#cbd5e1">\${escapeHtml(d.status)}</span>
        <p style="margin-top: 8px; color: #cbd5e1;">\${escapeHtml(d.description || '')}</p>

        \${tagsHtml ? '<div style="margin-top:10px;">' + tagsHtml + '</div>' : ''}

        \${sourcesHtml ? '<div class="meta-group"><div class="meta-label">Sources & Provenance</div><ul>' + sourcesHtml + '</ul></div>' : ''}

        <div class="meta-group">
          <div class="meta-label">Synthesized Document Body</div>
          <pre>\${escapeHtml(d.body || '')}</pre>
        </div>
      \`;
    }

    document.getElementById('search').addEventListener('input', function(e) {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        cy.elements().removeClass('dimmed');
        return;
      }

      cy.nodes().forEach(n => {
        const d = n.data();
        const haystack = (d.label + ' ' + d.description + ' ' + (d.tags || []).join(' ') + ' ' + d.type).toLowerCase();
        if (haystack.includes(q)) {
          n.removeClass('dimmed');
        } else {
          n.addClass('dimmed');
        }
      });
    });

    function escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
  </script>
</body>
</html>`;
}
