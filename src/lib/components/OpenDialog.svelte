<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { open as openDirDialog } from "@tauri-apps/plugin-dialog";
  import { openFile, openFileDialog } from "$lib/tauri/files";
  import { recentFiles, removeRecentFile } from "$lib/stores/recents";
  import { pinnedFolders } from "$lib/stores/pinned";
  import { isUrl, toRawUrl, urlToFileName } from "$lib/utils/url";
  import { renderFull } from "$lib/renderer/pipeline";
  import { tabStore } from "$lib/stores/tabs";
  import { document as docStore } from "$lib/stores/document";

  let { visible = $bindable(false) }: { visible: boolean } = $props();

  let urlInput = $state("");
  let urlLoading = $state(false);
  let urlError = $state("");

  interface PlanFile {
    name: string;
    path: string;
    modified: number;
  }

  interface MdFile {
    name: string;
    path: string;
    rel_path: string;
    modified: number;
  }

  let plans = $state<PlanFile[]>([]);
  let plansLoading = $state(false);
  let activeTab = $state<"recent" | "plans" | "folders">("recent");
  let folderFiles = $state<Record<string, MdFile[]>>({});
  let expandedDialogFolders = $state<Set<string>>(new Set());

  function toggleDialogFolder(path: string) {
    const next = new Set(expandedDialogFolders);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    expandedDialogFolders = next;
  }

  async function loadPlans() {
    plansLoading = true;
    try {
      plans = await invoke<PlanFile[]>("list_claude_plans");
    } catch {
      plans = [];
    }
    plansLoading = false;
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
        urlError = res.status === 404 ? "File not found." : res.status === 403 ? "Access denied." : `Failed (${res.status})`;
        urlLoading = false;
        return;
      }
      const markdown = await res.text();
      if (markdown.trim().startsWith("<!DOCTYPE") || markdown.trim().startsWith("<html")) {
        urlError = "URL returned HTML, not markdown.";
        urlLoading = false;
        return;
      }
      const result = renderFull(markdown);
      const fileName = urlToFileName(trimmed);
      const urlPath = `url://${trimmed}`;
      tabStore.addTab(urlPath, fileName, markdown, result.html, result.frontmatter, result.wordCount);
      docStore.set({ filePath: urlPath, fileName, content: markdown, renderedHtml: result.html, frontmatter: result.frontmatter, wordCount: result.wordCount, loading: false, error: null });
      urlInput = "";
      visible = false;
    } catch (err) {
      urlError = `Network error: ${err instanceof Error ? err.message : "Could not reach URL"}`;
    }
    urlLoading = false;
  }

  function handleOpenSystem() {
    visible = false;
    openFileDialog();
  }

  function handleOpenFile(path: string) {
    visible = false;
    openFile(path);
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      visible = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      visible = false;
    }
  }

  function formatTime(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  }

  function shortenPath(path: string): string {
    const home = "/Users/";
    if (path.startsWith(home)) {
      const rest = path.slice(home.length);
      const parts = rest.split("/");
      if (parts.length > 1) return "~/" + parts.slice(1).join("/");
    }
    return path;
  }

  function formatPlanName(name: string): string {
    return name.replace(/\.md$/, "").replace(/[-_]/g, " ");
  }

  async function loadFolderFiles() {
    for (const folder of $pinnedFolders) {
      if (!(folder in folderFiles)) {
        try {
          const files = await invoke<MdFile[]>("list_folder_md_files", { folder });
          folderFiles = { ...folderFiles, [folder]: files };
        } catch {
          folderFiles = { ...folderFiles, [folder]: [] };
        }
      }
    }
  }

  async function handleAddFolder() {
    try {
      const selected = await openDirDialog({ directory: true, multiple: false });
      if (selected && typeof selected === "string") {
        pinnedFolders.add(selected);
        const files = await invoke<MdFile[]>("list_folder_md_files", { folder: selected });
        folderFiles = { ...folderFiles, [selected]: files };
      }
    } catch {}
  }

  function getFolderName(path: string): string {
    return path.split("/").pop() || path;
  }

  $effect(() => {
    if (visible && activeTab === "plans") {
      loadPlans();
    }
  });

  $effect(() => {
    if (visible && activeTab === "folders") {
      loadFolderFiles();
    }
  });

  $effect(() => {
    if (visible) {
      activeTab = "recent";
      urlInput = "";
      urlError = "";
      // Auto-expand all folders
      expandedDialogFolders = new Set($pinnedFolders);
      // Preload in background
      loadPlans();
      loadFolderFiles();
    }
  });
</script>
{#if visible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="dialog-backdrop fixed inset-0 box ycenter xcenter pad-y-md" onclick={handleBackdropClick} onkeydown={handleKeydown}>
    <div class="dialog-card card  bg-dialog border  box dialog-h-screen dialog-lg">

      <header class="dialog-header row ycenter xbetween pad-x-sm pad-y-xs border-bottom">
        <h2 class="text-md weight-600 m-0">Open</h2>
        <button onclick={() => (visible = false)} class="button is-icon text-muted" aria-label="Close open dialog">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg>
        </button>
      </header>

      <!-- Quick entry -->
      <div class="box gap-2xs pad-x-sm pad-y-sm border-bottom">
        <button onclick={handleOpenSystem} class="browse-btn row ycenter gap-2xs wfull surface border  pad-x-xs pad-y-2xs text-sm text-primary text-left cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
            <path d="M2 5l4-3h8v11H2V5z"/><line x1="2" y1="5" x2="6" y2="5"/>
          </svg>
          <span class="grow">Browse Files…</span>
          <span class="text-xs text-muted mono">⌘O</span>
        </button>
        <div class="row gap-2xs">
          <input type="text" bind:value={urlInput}
            placeholder="Paste a URL to open…"
            class="input mono text-sm grow min0"
            onkeydown={(e) => e.key === 'Enter' && handleFetchUrl()} />
          <button onclick={handleFetchUrl} disabled={urlLoading || !urlInput.trim()} class="button primary text-sm shrink-0">
            {urlLoading ? "…" : "Fetch"}
          </button>
        </div>
        {#if urlError}
          <div class="text-xs text-danger pad-x-xs pad-y-2xs  bg-danger-soft">{urlError}</div>
        {/if}
      </div>

      <!-- Tabs -->
      <nav class="row gap-3xs pad-x-sm pad-y-2xs border-bottom" aria-label="Open source">
        <button class="dialog-tab" class:dialog-tab-active={activeTab === "recent"} onclick={() => (activeTab = "recent")}>
          Recent {#if $recentFiles.length > 0}<span class="badge text-xs">{$recentFiles.length}</span>{/if}
        </button>
        <button class="dialog-tab" class:dialog-tab-active={activeTab === "folders"} onclick={() => { activeTab = "folders"; loadFolderFiles(); }}>
          Folders {#if $pinnedFolders.length > 0}<span class="badge text-xs">{$pinnedFolders.length}</span>{/if}
        </button>
        <button class="dialog-tab" class:dialog-tab-active={activeTab === "plans"} onclick={() => { activeTab = "plans"; loadPlans(); }}>
          Plans {#if plans.length > 0}<span class="badge text-xs">{plans.length}</span>{/if}
        </button>
      </nav>

      <!-- Content -->
      <div class="dialog-content box gap-3xs pad-x-xs pad-y-xs grow min0 overflow-y-auto dialog-content-flex">

        {#if activeTab === "recent"}
          {#if $recentFiles.length === 0}
            <div class="empty-list box ycenter xcenter gap-2xs pad-y-xl text-muted text-sm">No recent files</div>
          {:else}
            {#each $recentFiles as file (file.path)}
              <button class="file-item row ycenter gap-xs wfull pad-x-sm pad-y-2xs  text-left cursor-pointer" onclick={() => handleOpenFile(file.path)}>
                <span class="file-icon shrink-0 text-muted" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="2" y="1" width="10" height="12" rx="1.5"/><line x1="4.5" y1="4" x2="9.5" y2="4"/><line x1="4.5" y1="6.5" x2="8" y2="6.5"/><line x1="4.5" y1="9" x2="9" y2="9"/></svg>
                </span>
                <span class="box gap-3xs grow min0">
                  <span class="text-sm weight-500 truncate">{file.name}</span>
                  <span class="text-xs text-muted truncate">{shortenPath(file.path)}</span>
                </span>
                <span class="text-xs text-muted shrink-0 tabular-nums">{formatTime(file.openedAt)}</span>
              </button>
            {/each}
          {/if}

        {:else if activeTab === "folders"}
          {#if $pinnedFolders.length === 0}
            <div class="empty-list box ycenter xcenter gap-2xs pad-y-xl">
              <p class="text-muted text-sm m-0">No pinned folders</p>
              <button class="button ghost text-sm" onclick={handleAddFolder}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="shrink-0"><line x1="7" y1="3" x2="7" y2="11"/><line x1="3" y1="7" x2="11" y2="7"/></svg>
                Pin a folder
              </button>
            </div>
          {:else}
            {#each $pinnedFolders as folder (folder)}
              <div class="box gap-3xs">
                <button class="folder-header row ycenter gap-2xs wfull pad-x-sm pad-y-2xs  text-sm text-primary text-left cursor-pointer" onclick={() => toggleDialogFolder(folder)}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" class="folder-chevron shrink-0 text-muted" class:folder-chevron-open={expandedDialogFolders.has(folder)} aria-hidden="true">
                    <path d="M3 1l4 4-4 4"/>
                  </svg>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" class="shrink-0" aria-hidden="true">
                    <path d="M1.5 4.5l3-2.5h8v9H1.5V4.5z"/><line x1="1.5" y1="4.5" x2="4.5" y2="4.5"/>
                  </svg>
                  <span class="folder-name weight-500">{getFolderName(folder)}</span>
                  <span class="folder-file-count text-xs text-muted tabular-nums">{folderFiles[folder]?.length ?? '…'}</span>
                  <span class="folder-path text-xs text-muted truncate grow min0 text-right">{shortenPath(folder)}</span>
                </button>
                {#if expandedDialogFolders.has(folder)}
                  {#if folderFiles[folder]}
                    {#each folderFiles[folder] as file (file.path)}
                      <button class="file-item file-item-nested row ycenter gap-xs wfull pad-x-sm pad-y-2xs  text-left cursor-pointer" onclick={() => handleOpenFile(file.path)}>
                        <span class="file-icon shrink-0 text-muted" aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="2" y="1" width="10" height="12" rx="1.5"/><line x1="4.5" y1="4" x2="9.5" y2="4"/><line x1="4.5" y1="6.5" x2="8" y2="6.5"/><line x1="4.5" y1="9" x2="9" y2="9"/></svg>
                        </span>
                        <span class="box gap-3xs grow min0">
                          <span class="text-sm weight-500 truncate">{file.name}</span>
                          {#if file.rel_path !== file.name}
                            <span class="text-xs text-muted truncate">{file.rel_path}</span>
                          {/if}
                        </span>
                        <span class="text-xs text-muted shrink-0 tabular-nums">{formatTime(file.modified)}</span>
                      </button>
                    {/each}
                  {:else}
                    <div class="folder-loading-inline pad-x-md pad-y-2xs text-xs text-muted">Loading…</div>
                  {/if}
                {/if}
              </div>
            {/each}
            <button class="button ghost text-sm align-self-start add-folder-btn" onclick={handleAddFolder}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="shrink-0"><line x1="6" y1="2" x2="6" y2="10"/><line x1="2" y1="6" x2="10" y2="6"/></svg>
              Add folder
            </button>
          {/if}

        {:else}
          {#if plansLoading}
            <div class="empty-list box ycenter xcenter pad-y-xl text-muted text-sm">Loading plans…</div>
          {:else if plans.length === 0}
            <div class="empty-list box ycenter xcenter gap-3xs pad-y-xl text-center">
              <p class="text-muted text-sm m-0">No Claude Code plans found</p>
              <span class="text-xs text-muted">Plans are stored in ~/.claude/plans/</span>
            </div>
          {:else}
            {#each plans as plan (plan.path)}
              <button class="file-item row ycenter gap-xs wfull pad-x-sm pad-y-2xs  text-left cursor-pointer" onclick={() => handleOpenFile(plan.path)}>
                <span class="file-icon shrink-0 text-muted" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="2" y="1" width="10" height="12" rx="1.5"/><polyline points="5,5 6.5,6.5 9,4"/><line x1="4.5" y1="8.5" x2="9.5" y2="8.5"/><line x1="4.5" y1="10.5" x2="8" y2="10.5"/></svg>
                </span>
                <span class="box gap-3xs grow min0">
                  <span class="text-sm weight-500 truncate">{formatPlanName(plan.name)}</span>
                  <span class="text-xs text-muted truncate">{shortenPath(plan.path)}</span>
                </span>
                <span class="text-xs text-muted shrink-0 tabular-nums">{formatTime(plan.modified)}</span>
              </button>
            {/each}
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
