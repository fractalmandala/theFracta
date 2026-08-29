<script lang="ts">
  import { onMount, tick } from "svelte";
  import { get } from "svelte/store";
  import { invoke } from "@tauri-apps/api/core";
  import { settings, fontFamilyMap, getContentMaxWidth } from "$lib/stores/settings";
  import { tocEntries, activeHeadingId, extractToc, isObserverPaused } from "$lib/stores/toc";
  import { aiLookup, setPendingSelection } from "$lib/stores/aiLookup";
  import mermaid from "mermaid";

  let {
    html = "",
    onImageClick = (_src: string, _all: string[], _idx: number) => {},
    onLocalLink,
  }: {
    html: string;
    onImageClick?: (src: string, allImages: string[], index: number) => void;
    /**
     * Called when a link to a local file (relative or absolute path, no URL
     * scheme) is clicked. The parent resolves it against the current document
     * and opens it in-app or via the OS (issue #30). When omitted, such links
     * fall back to the external opener.
     */
    onLocalLink?: (href: string) => void;
  } = $props();

  /** True for hrefs that are real URLs (browser/mail/etc.), not filesystem paths. */
  function isUrlHref(href: string): boolean {
    // Any explicit scheme except file: — http, https, mailto, tel, data, blob…
    // `file:` is a local file (handled by onLocalLink), so it's excluded here.
    return /^(?!file:)[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//");
  }

  let articleEl: HTMLElement | undefined = $state();
  let observer: IntersectionObserver | undefined;
  let lastMermaidTheme = "";
  let tooltipEl: HTMLDivElement | undefined;

  function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = "none";
  }

  function initMermaid() {
    const isDark = document.documentElement.classList.contains("dark");
    const theme = isDark ? "dark" : "default";
    if (theme === lastMermaidTheme) return;
    lastMermaidTheme = theme;
    mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: "loose",
      themeVariables: isDark ? {
        primaryColor: "#0A1E2E",
        primaryTextColor: "#e5e5e7",
        primaryBorderColor: "#0891B2",
        lineColor: "#8e8e93",
        secondaryColor: "#1c1c1e",
        tertiaryColor: "#2c2c2e",
        noteBkgColor: "#2c2c2e",
        noteTextColor: "#e5e5e7",
        actorTextColor: "#e5e5e7",
        actorLineColor: "#636366",
        signalColor: "#aeaeb2",
        signalTextColor: "#e5e5e7",
      } : {},
    });
  }

  async function renderMermaidBlocks() {
    if (!articleEl) return;
    const blocks = articleEl.querySelectorAll("code.language-mermaid");
    if (blocks.length === 0) return;

    initMermaid();

    for (const block of blocks) {
      const pre = block.parentElement;
      if (!pre || pre.tagName !== "PRE") continue;
      if (pre.dataset.mermaidRendered) continue;

      const source = block.textContent ?? "";
      const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;

      try {
        const { svg } = await mermaid.render(id, source);
        const container = document.createElement("div");
        container.className = "mermaid-diagram my-4 flex justify-center";
        container.innerHTML = svg;
        pre.replaceWith(container);
      } catch {
        // Leave the code block as-is if Mermaid fails
        pre.dataset.mermaidRendered = "failed";
      }
    }
  }

  function setupTocObserver() {
    if (!articleEl) return;
    if (observer) observer.disconnect();

    const headings = articleEl.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]");
    if (headings.length === 0) return;

    observer = new IntersectionObserver(
      (entries) => {
        if (isObserverPaused()) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeHeadingId.set(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((h) => observer!.observe(h));
  }

  // Right-click on the rendered article opens the AI Lookup native context
  // menu. We suppress the default webview menu (Cut/Copy/Paste — they're
  // rebuilt as the first items of our menu) and pass a slim provider payload
  // to Rust (no urlTemplate, no prompt template body — those stay
  // frontend-side; Rust only needs id/name to build the menu).
  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    const selection = window.getSelection()?.toString() ?? "";
    setPendingSelection(selection);

    const providers = get(aiLookup).providers.map((p) => ({
      id: p.id,
      name: p.name,
      prompts: p.prompts.map((pr) => ({ id: pr.id, name: pr.name })),
    }));

    invoke("show_ai_context_menu", {
      providers,
      hasSelection: selection.trim().length > 0,
    }).catch((err) => console.error("show_ai_context_menu failed:", err));
  }

  onMount(() => {
    articleEl?.addEventListener("contextmenu", handleContextMenu);
    return () => {
      articleEl?.removeEventListener("contextmenu", handleContextMenu);
      observer?.disconnect();
      // Remove the body-level tooltip so it can't outlive the component.
      tooltipEl?.remove();
      tooltipEl = undefined;
    };
  });

  $effect(() => {
    // Re-run when html changes
    html;

    // A re-render (e.g. opening a linked file in a new tab) replaces the
    // article, so a hover's mouseleave may never fire — clear any stuck tooltip.
    hideTooltip();

    tick().then(() => {
      if (!articleEl) return;

      // Extract TOC entries
      const entries = extractToc(articleEl);
      tocEntries.set(entries);

      // Set up intersection observer for active heading
      setupTocObserver();

      // Add copy buttons to code blocks
      addCodeCopyButtons();

      // Add image click handlers for lightbox
      addImageClickHandlers();

      // Add link hover tooltips
      addLinkTooltips();

      // Open external links in system browser
      addLinkHandlers();

      // Render Mermaid diagrams
      renderMermaidBlocks();
    });
  });

  function addImageClickHandlers() {
    if (!articleEl) return;
    const imgs = articleEl.querySelectorAll("img");
    const allSrcs = Array.from(imgs).map((img) => img.src).filter(Boolean);

    imgs.forEach((img, idx) => {
      if (img.dataset.lightboxBound) return;
      img.dataset.lightboxBound = "true";
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => {
        onImageClick(img.src, allSrcs, idx);
      });
    });
  }

  function addLinkTooltips() {
    if (!articleEl) return;

    // Create tooltip element once
    // Sweep any orphaned tooltips left by dev HMR reloads so they can't pile up.
    document.querySelectorAll(".link-tooltip").forEach((el) => {
      if (el !== tooltipEl) el.remove();
    });
    if (!tooltipEl || !tooltipEl.isConnected) {
      tooltipEl = document.createElement("div");
      tooltipEl.className = "link-tooltip";
      document.body.appendChild(tooltipEl);
    }

    const links = articleEl.querySelectorAll("a[href]");
    links.forEach((link) => {
      if ((link as HTMLElement).dataset.tooltipBound) return;
      (link as HTMLElement).dataset.tooltipBound = "true";

      link.addEventListener("mouseenter", (e) => {
        const href = link.getAttribute("href") ?? "";
        if (!href || href.startsWith("#")) return;
        tooltipEl!.textContent = href;
        tooltipEl!.style.display = "block";
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        tooltipEl!.style.left = `${rect.left}px`;
        tooltipEl!.style.top = `${rect.bottom + 4}px`;
      });

      link.addEventListener("mouseleave", hideTooltip);
    });
  }

  function addLinkHandlers() {
    if (!articleEl) return;
    const links = articleEl.querySelectorAll("a[href]");
    links.forEach((link) => {
      if ((link as HTMLElement).dataset.linkBound) return;
      const href = link.getAttribute("href") ?? "";
      // Skip anchor links (in-page navigation handled by the browser default).
      if (!href || href.startsWith("#")) return;
      (link as HTMLElement).dataset.linkBound = "true";
      link.addEventListener("click", async (e) => {
        e.preventDefault();
        hideTooltip();
        // Local file path (no URL scheme, or a file: URL) → let the parent
        // resolve it against the current document and open it (#30).
        if (onLocalLink && !isUrlHref(href)) {
          onLocalLink(href);
          return;
        }
        // Real URL → external opener (browser, mail client, …).
        try {
          const { openUrl } = await import("@tauri-apps/plugin-opener");
          await openUrl(href);
        } catch {
          window.open(href, "_blank");
        }
      });
    });
  }

  function addCodeCopyButtons() {
    if (!articleEl) return;
    const pres = articleEl.querySelectorAll("pre");

    for (const pre of pres) {
      if (pre.querySelector(".code-copy-btn")) continue;
      if (pre.dataset.mermaidRendered) continue;

      // Make pre relative for absolute positioning of the button
      pre.style.position = "relative";

      const btn = document.createElement("button");
      btn.className = "code-copy-btn";
      btn.textContent = "Copy";
      btn.addEventListener("click", () => {
        const code = pre.querySelector("code");
        const text = code?.textContent ?? pre.textContent ?? "";
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = "Copied!";
          setTimeout(() => (btn.textContent = "Copy"), 1500);
        });
      });

      pre.appendChild(btn);
    }
  }
</script>

<article
  bind:this={articleEl}
  class="md-content"
  style="
    --content-max: {getContentMaxWidth($settings)};
    font-size: {$settings.fontSize}px;
    line-height: {$settings.lineHeight};
    --md-font-family: {fontFamilyMap[$settings.fontFamily]};
  "
>
  {@html html}
</article>
