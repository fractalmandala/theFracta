<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { open } from "@tauri-apps/plugin-dialog";
  import { openFileDialog, openFile, newDocument } from "../tauri/files";
  import { recentFiles, clearRecentFiles } from "../stores/recents";
  import { pinnedFolders } from "../stores/pinned";
  import { settings } from "../stores/settings";
  import { Icon } from "fractalicons";
  import { luBookOpen } from "fractalicons/lucide";

  let { onOpenUrl = () => {} }: { onOpenUrl?: () => void } = $props();

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
  let folderFiles = $state<Record<string, MdFile[]>>({});
  let plansHidden = $state(localStorage.getItem("fracta-knowledge-plans-hidden") === "true");

  function hidePlans() {
    plansHidden = true;
    localStorage.setItem("fracta-knowledge-plans-hidden", "true");
  }

  function showPlans() {
    plansHidden = false;
    localStorage.removeItem("fracta-knowledge-plans-hidden");
  }

  $effect(() => {
    invoke<PlanFile[]>("list_claude_plans").then((p) => { plans = p; }).catch(() => {});
  });

  $effect(() => {
    const folders = $pinnedFolders;
    for (const folder of folders) {
      if (!(folder in folderFiles)) {
        invoke<MdFile[]>("list_folder_md_files", { folder }).then((files) => {
          folderFiles = { ...folderFiles, [folder]: files };
        }).catch(() => {
          folderFiles = { ...folderFiles, [folder]: [] };
        });
      }
    }
  });

  async function addPinnedFolder() {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === "string") {
        pinnedFolders.add(selected);
        invoke<MdFile[]>("list_folder_md_files", { folder: selected }).then((files) => {
          folderFiles = { ...folderFiles, [selected]: files };
        }).catch(() => {});
      }
    } catch {}
  }

  function removePinnedFolder(e: MouseEvent, path: string) {
    e.stopPropagation();
    pinnedFolders.remove(path);
    const { [path]: _, ...rest } = folderFiles;
    folderFiles = rest;
  }

  function getFolderName(path: string): string {
    return path.split("/").pop() || path;
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

  // Scale home screen UI based on font size setting (17px = 1.0)
  let scale = $derived($settings.fontSize / 17);
</script>
<div class="empty-root box gap-md pad-md pad-x-lg" style="zoom: var(--zoom, 1);">

	<!-- Hero -->
	<header class="empty-hero row ycenter gap-xs pad-bottom-2xs">
		<span class="empty-hero-icon  box ycenter xcenter icon-44">
			<Icon icon={luBookOpen} size={44} title="Fracta Knowledge" />
		</span>
		<div class="box gap-3xs">
			<h1 class="text-lg weight-700 m-0 title-tight">Fracta Knowledge</h1>
			<p class="text-sm text-muted m-0">A native Markdown reader and editor.</p>
		</div>
	</header>

	<!-- Quick actions -->
	<div class="row wrap gap-2xs">
		<button class="button primary text-sm row ycenter gap-2xs" onclick={newDocument}>
			<svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M3 1.5h6l3 3v9H3V1.5z"/><line x1="7.5" y1="6" x2="7.5" y2="11"/><line x1="5" y1="8.5" x2="10" y2="8.5"/></svg>
			New Document
		</button>
		<button class="button ghost text-sm row ycenter gap-2xs" onclick={openFileDialog}>
			<svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M1.5 5l3-2.5h9v10H1.5V5z"/><line x1="1.5" y1="5" x2="4.5" y2="5"/></svg>
			Browse Files
		</button>
		<button class="button ghost text-sm row ycenter gap-2xs" onclick={onOpenUrl}>
			<svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><circle cx="7.5" cy="7.5" r="5.5"/><ellipse cx="7.5" cy="7.5" rx="2.5" ry="5.5"/><line x1="2" y1="7.5" x2="13" y2="7.5"/></svg>
			Open URL
		</button>
		<button class="button ghost text-sm row ycenter gap-2xs" onclick={addPinnedFolder}>
			<svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" class="shrink-0"><line x1="7.5" y1="3" x2="7.5" y2="12"/><line x1="3" y1="7.5" x2="12" y2="7.5"/></svg>
			Pin Folder
		</button>
	</div>

	<!-- Recent + Plans + Folders panels -->
	{#if (plans.length > 0 && !plansHidden) || $pinnedFolders.length > 0 || $recentFiles.length > 0}
		<div class="panels-grid grid-2 gap-md">

			{#if $recentFiles.length > 0}
				<section class="box gap-2xs">
					<header class="row ycenter xbetween pad-x-3xs">
						<h2 class="text-xs weight-600 tt-u text-muted m-0">Recent Files</h2>
						<button class="text-xs text-muted cursor-pointer bg-transparent border-0" onclick={() => { clearRecentFiles(); }}>Clear</button>
					</header>
					<div class="card border ">
						<div class="empty-card-scroll box">
							{#each $recentFiles as file (file.path)}
								<button class="empty-item row ycenter gap-xs wfull pad-x-xs pad-y-2xs text-left border-bottom cursor-pointer"
									onclick={() => openFile(file.path)}>
									<span class="empty-item-icon shrink-0" aria-hidden="true">
										<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="2" y="1" width="10" height="12" rx="1.5"/><line x1="4.5" y1="4" x2="9.5" y2="4"/><line x1="4.5" y1="6.5" x2="8" y2="6.5"/><line x1="4.5" y1="9" x2="9.5" y2="9"/></svg>
									</span>
									<span class="box gap-3xs grow min0">
										<span class="text-sm weight-500 truncate">{file.name}</span>
										<span class="text-xs text-muted truncate">{shortenPath(file.path)}</span>
									</span>
									<span class="text-xs text-muted shrink-0 tabular-nums">{formatTime(file.openedAt)}</span>
								</button>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			{#if plans.length > 0 && !plansHidden}
				<section class="box gap-2xs">
					<header class="row ycenter gap-2xs pad-x-3xs">
						<h2 class="text-xs weight-600 tt-u text-muted m-0 row ycenter gap-3xs grow">
							<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="2" y="1" width="10" height="12" rx="1.5"/><polyline points="5,5 6.5,6.5 9,4"/><line x1="4.5" y1="8.5" x2="9.5" y2="8.5"/><line x1="4.5" y1="10.5" x2="8" y2="10.5"/></svg>
							Claude Plans
						</h2>
						<span class="badge text-xs">{plans.length}</span>
						<button class="button is-icon text-muted" onclick={hidePlans} title="Hide Claude Plans" aria-label="Hide Claude Plans">
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>
						</button>
					</header>
					<div class="card border ">
						<div class="empty-card-scroll box">
							{#each plans as plan (plan.path)}
								<button class="empty-item row ycenter gap-xs wfull pad-x-xs pad-y-2xs text-left border-bottom cursor-pointer" onclick={() => openFile(plan.path)}>
									<span class="empty-item-icon shrink-0" aria-hidden="true">
										<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="2" y="1" width="10" height="12" rx="1.5"/><polyline points="5,5 6.5,6.5 9,4"/><line x1="4.5" y1="8.5" x2="9.5" y2="8.5"/><line x1="4.5" y1="10.5" x2="8" y2="10.5"/></svg>
									</span>
									<span class="box gap-3xs grow min0">
										<span class="text-sm weight-500 truncate">{formatPlanName(plan.name)}</span>
										<span class="text-xs text-muted truncate">{shortenPath(plan.path)}</span>
									</span>
									<span class="text-xs text-muted shrink-0 tabular-nums">{formatTime(plan.modified)}</span>
								</button>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			{#each $pinnedFolders as folder (folder)}
				<section class="box gap-2xs">
					<header class="row ycenter gap-2xs pad-x-3xs">
						<h2 class="text-xs weight-600 tt-u text-muted m-0 row ycenter gap-3xs grow">
							<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 4.5l3-2.5h8v9H1.5V4.5z"/><line x1="1.5" y1="4.5" x2="4.5" y2="4.5"/></svg>
							{getFolderName(folder)}
						</h2>
						<span class="badge text-xs">{folderFiles[folder]?.length ?? '…'}</span>
						<button class="button is-icon text-muted" onclick={(e) => removePinnedFolder(e, folder)} title="Unpin" aria-label={`Unpin ${getFolderName(folder)}`}>
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>
						</button>
					</header>
					<div class="card border ">
						<div class="empty-card-scroll box">
							{#if !folderFiles[folder]}
								<div class="card-empty pad-sm text-xs text-muted text-center">Loading…</div>
							{:else if folderFiles[folder].length === 0}
								<div class="card-empty pad-sm text-xs text-muted text-center">No markdown files</div>
							{:else}
								{#each folderFiles[folder] as file (file.path)}
									<button class="empty-item row ycenter gap-xs wfull pad-x-xs pad-y-2xs text-left border-bottom cursor-pointer" onclick={() => openFile(file.path)}>
										<span class="empty-item-icon shrink-0" aria-hidden="true">
											<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="2" y="1" width="10" height="12" rx="1.5"/><line x1="4.5" y1="4" x2="9.5" y2="4"/><line x1="4.5" y1="6.5" x2="8" y2="6.5"/><line x1="4.5" y1="9" x2="9.5" y2="9"/></svg>
										</span>
										<span class="box gap-3xs grow min0">
											<span class="text-sm weight-500 truncate">{file.name}</span>
											{#if file.rel_path !== file.name}<span class="text-xs text-muted truncate">{file.rel_path}</span>{/if}
										</span>
										<span class="text-xs text-muted shrink-0 tabular-nums">{formatTime(file.modified)}</span>
									</button>
								{/each}
							{/if}
						</div>
					</div>
				</section>
			{/each}

		</div>
	{/if}

	<!-- Footer hints -->
	<footer class="empty-footer row ycenter xbetween pad-top-xs mta">
		<div class="row wrap gap-2xs text-xs text-muted">
			<span><kbd class="kbd text-3xs">⌘O</kbd> browse</span>
			<span><kbd class="kbd text-3xs">⌘⇧V</kbd> paste</span>
			<span><kbd class="kbd text-3xs">⌘T</kbd> new tab</span>
			{#if plansHidden && plans.length > 0}
				<button class="empty-footer-link text-xs text-theme bg-transparent border-0 cursor-pointer" onclick={showPlans}>Show Claude Plans</button>
			{/if}
		</div>
		<div class="row ycenter gap-3xs">
			<button class="button is-icon text-muted" onclick={() => settings.update((s) => ({ ...s, fontSize: Math.max(s.fontSize - 1, 10) }))} title="Zoom out" aria-label="Zoom out">
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="6" x2="10" y2="6"/></svg>
			</button>
			<span class="empty-zoom-label text-xs text-muted tabular-nums">{$settings.fontSize}px</span>
			<button class="button is-icon text-muted" onclick={() => settings.update((s) => ({ ...s, fontSize: Math.min(s.fontSize + 1, 32) }))} title="Zoom in" aria-label="Zoom in">
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="2" x2="6" y2="10"/><line x1="2" y1="6" x2="10" y2="6"/></svg>
			</button>
		</div>
	</footer>
</div>
