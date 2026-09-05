<script lang="ts">
  import { isLlmEscaped, unescapeLlmOutput } from "$lib/utils/llm";
  import { isUrl, toRawUrl, urlToFileName } from "$lib/utils/url";
  import { renderFull } from "$lib/renderer/pipeline";
  import { tabStore } from "$lib/stores/tabs";

  let { visible = $bindable(false), defaultMode = "paste" }: { visible: boolean; defaultMode?: "paste" | "url" } = $props();

  let mode = $state<"paste" | "url">("paste");
  let text = $state("");
  let urlInput = $state("");
  let llmMode = $state(true);
  let autoDetected = $state(false);
  let urlLoading = $state(false);
  let urlError = $state("");

  function handleRender() {
    if (!text.trim()) return;

    let markdown = text;
    if (llmMode && isLlmEscaped(text)) {
      markdown = unescapeLlmOutput(text);
    }

    const result = renderFull(markdown);
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const fileName = `Pasted — ${timeLabel}`;

    const pastePath = `paste://${Date.now()}`;
    tabStore.addTab(pastePath, fileName, markdown, result.html, result.frontmatter, result.wordCount);

    text = "";
    visible = false;
  }

  async function handleFetchUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed || !isUrl(trimmed)) {
      urlError = "Please enter a valid URL";
      return;
    }

    urlLoading = true;
    urlError = "";

    try {
      const rawUrl = toRawUrl(trimmed);
      const res = await fetch(rawUrl);

      if (!res.ok) {
        if (res.status === 404) {
          urlError = "File not found. Check the URL or ensure the repo is public.";
        } else if (res.status === 403) {
          urlError = "Access denied. This may be a private repository.";
        } else {
          urlError = `Failed to fetch (${res.status})`;
        }
        urlLoading = false;
        return;
      }

      const markdown = await res.text();

      // Check if it looks like markdown/text (not HTML or binary)
      if (markdown.trim().startsWith("<!DOCTYPE") || markdown.trim().startsWith("<html")) {
        urlError = "URL returned HTML, not markdown. Try a raw/direct link.";
        urlLoading = false;
        return;
      }

      const result = renderFull(markdown);
      const fileName = urlToFileName(trimmed);
      const urlPath = `url://${trimmed}`;

      tabStore.addTab(urlPath, fileName, markdown, result.html, result.frontmatter, result.wordCount);

      urlInput = "";
      visible = false;
    } catch (err) {
      urlError = `Network error: ${err instanceof Error ? err.message : "Could not reach URL"}`;
    }

    urlLoading = false;
  }

  function handleInput() {
    if (text.length > 10) {
      autoDetected = isLlmEscaped(text);
    } else {
      autoDetected = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      visible = false;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (mode === "paste") {
        handleRender();
      } else {
        handleFetchUrl();
      }
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      visible = false;
    }
  }

  $effect(() => {
    if (visible) {
      text = "";
      urlInput = "";
      urlError = "";
      autoDetected = false;
      mode = defaultMode;
    }
  });
  /**
   * A native <dialog>, opened with showModal(). The browser owns the top layer,
   * the focus trap, the inert background and Escape — all of which were either
   * hand-rolled per dialog or simply missing. ::backdrop replaces the scrim.
   */
  let el = $state<HTMLDialogElement | null>(null);

  $effect(() => {
    if (!el) return;
    if (visible && !el.open) el.showModal();
    else if (!visible && el.open) el.close();
  });

  // A backdrop click lands on the dialog element itself; content is in a child.
  function onBackdropClick(e: MouseEvent) {
    if (e.target === el) visible = false;
  }

</script>
<dialog
  bind:this={el}
  class="dialog dialog-h-screen dialog-xl"
  onclose={() => (visible = false)}
  onclick={onBackdropClick}
>
  <div class="box hfull min0">

      <header class="row ycenter xbetween pad-x-sm pad-y-xs border-bottom">
        <div class="row ycenter gap-2xs">
          <div class="segmented row gap-3xs surface pad-3xs">
            <button class="segmented-item" class:active={mode === "paste"} onclick={() => (mode = "paste")}>Paste</button>
            <button class="segmented-item" class:active={mode === "url"} onclick={() => (mode = "url")}>Open URL</button>
          </div>
          {#if mode === "paste" && autoDetected}
            <span class="badge text-xs">LLM detected</span>
          {/if}
        </div>
        <div class="row ycenter gap-2xs">
          {#if mode === "paste"}
            <label class="row ycenter gap-3xs text-xs text-secondary cursor-pointer">
              <input type="checkbox" bind:checked={llmMode} class="shrink-0" />
              <span>LLM Mode</span>
            </label>
          {/if}
          <button onclick={() => (visible = false)} class="button is-icon text-muted" aria-label="Close paste modal">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg>
          </button>
        </div>
      </header>

      {#if mode === "paste"}
        <div class="pad-sm scroll-y pad-x-sm pad-y-sm box grow min0">
          <textarea bind:value={text} oninput={handleInput}
            placeholder="Paste markdown here...&#10;&#10;Supports raw markdown and LLM API responses with escaped \n characters."
            class="modal-textarea input text-sm mono wfull h-192"></textarea>
        </div>

        <footer class="row ycenter xbetween pad-x-sm pad-y-xs border-top">
          <span class="text-xs text-muted">Cmd+Enter to render</span>
          <div class="row gap-2xs">
            <button onclick={() => (visible = false)} class="button ghost text-sm">Cancel</button>
            <button onclick={handleRender} disabled={!text.trim()} class="button primary text-sm">Render</button>
          </div>
        </footer>

      {:else}
        <div class="pad-sm scroll-y box gap-sm pad-x-sm pad-y-sm grow min0">
          <div class="row gap-2xs">
            <input type="text" bind:value={urlInput}
              placeholder="https://github.com/user/repo/blob/main/README.md"
              class="input mono text-sm grow min0" />
            <button onclick={handleFetchUrl} disabled={urlLoading || !urlInput.trim()} class="button primary text-sm shrink-0">
              {urlLoading ? "Fetching…" : "Fetch"}
            </button>
          </div>
          {#if urlError}
            <div class="text-xs text-danger pad-x-xs pad-y-2xs bg-danger-soft">{urlError}</div>
          {/if}
          <div class="text-muted surface pad-xs box gap-3xs text-xs text-secondary">
            <p class="text-xs weight-600 tt-u text-muted pad-bottom-3xs">Supported URLs</p>
            <ul class="box gap-3xs unstyled pad-md">
              <li>GitHub — <code class="kbd text-2xs">github.com/user/repo/blob/main/file.md</code></li>
              <li>Gist — <code class="kbd text-2xs">gist.github.com/user/id</code></li>
              <li>GitLab — <code class="kbd text-2xs">gitlab.com/user/repo/-/blob/main/file.md</code></li>
              <li>Bitbucket — <code class="kbd text-2xs">bitbucket.org/user/repo/src/main/file.md</code></li>
              <li>Any raw URL — <code class="kbd text-2xs">https://example.com/doc.md</code></li>
            </ul>
          </div>
        </div>

        <footer class="row ycenter xbetween pad-x-sm pad-y-xs border-top">
          <span class="text-xs text-muted">Cmd+Enter to fetch</span>
          <div class="row gap-2xs">
            <button onclick={() => (visible = false)} class="button ghost text-sm">Cancel</button>
          </div>
        </footer>
      {/if}
  </div>
</dialog>
