<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { open } from "@tauri-apps/plugin-dialog";
  import { openFileDialog, openFile, newDocument } from "../tauri/files";
  import { recentFiles, clearRecentFiles } from "../stores/recents";
  import { pinnedFolders } from "../stores/pinned";
  import { settings } from "../stores/settings";
  import { Icon } from "fractalicons";
  import { luBookOpen } from "fractalicons/lucide";
	import { cuFile, cuGlobeAlt, cuStorage, cuPin } from 'fractalicons/coreui'

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
<div class="ycenter xcenter hfull ta-c grow box" style="zoom: var(--zoom, 1);">

	<!-- Quick actions -->
	<div class="row wrap gap-sm">
		<button class="button is-icon-text" onclick={newDocument}>
			<Icon icon={cuFile} size={16}/>
			New Document
		</button>
		<button class="button is-icon-text outline" onclick={openFileDialog}>
						<Icon icon={cuStorage} size={16}/>
			Browse Files
		</button>
		<button class="button is-icon-text outline" onclick={onOpenUrl}>
						<Icon icon={cuGlobeAlt} size={16}/>
			Open URL
		</button>
		<button class="button is-icon-text outline" onclick={addPinnedFolder}>
									<Icon icon={cuPin} size={16}/>
			Pin Folder
		</button>
	</div>

	<!-- Recent + Plans + Folders panels -->
	{#if (plans.length > 0 && !plansHidden) || $pinnedFolders.length > 0 || $recentFiles.length > 0}
		<div class="card-grid gap-sm grid-2 gap-md">

			{#if $recentFiles.length > 0}
				<section class="box gap-2xs">
					<header class="row ycenter xbetween pad-x-3xs">
						<h2 class="text-xs weight-600 tt-u text-muted">Recent Files</h2>
						<button class="text-xs text-muted cursor-pointer blank" onclick={() => { clearRecentFiles(); }}>Clear</button>
					</header>
					<div class="card border">
						<div class="scroll-y min0 box">
							{#each $recentFiles as file (file.path)}
								<button class="gap-3xs text-sm text-secondary row ycenter gap-xs wfull pad-x-xs pad-y-2xs ta-l border-bottom cursor-pointer"
									onclick={() => openFile(file.path)}>
									<span class="text-muted shrink-0" aria-hidden="true">
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
						<h2 class="text-xs weight-600 tt-u text-muted row ycenter gap-3xs grow">
							<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><rect x="2" y="1" width="10" height="12" rx="1.5"/><polyline points="5,5 6.5,6.5 9,4"/><line x1="4.5" y1="8.5" x2="9.5" y2="8.5"/><line x1="4.5" y1="10.5" x2="8" y2="10.5"/></svg>
							Claude Plans
						</h2>
						<span class="badge text-xs">{plans.length}</span>
						<button class="button is-icon text-muted" onclick={hidePlans} title="Hide Claude Plans" aria-label="Hide Claude Plans">
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>
						</button>
					</header>
					<div class="card border">
						<div class="scroll-y min0 box">
							{#each plans as plan (plan.path)}
								<button class="gap-3xs text-sm text-secondary row ycenter gap-xs wfull pad-x-xs pad-y-2xs ta-l border-bottom cursor-pointer" onclick={() => openFile(plan.path)}>
									<span class="text-muted shrink-0" aria-hidden="true">
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
						<h2 class="text-xs weight-600 tt-u text-muted row ycenter gap-3xs grow">
							<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 4.5l3-2.5h8v9H1.5V4.5z"/><line x1="1.5" y1="4.5" x2="4.5" y2="4.5"/></svg>
							{getFolderName(folder)}
						</h2>
						<span class="badge text-xs">{folderFiles[folder]?.length ?? '…'}</span>
						<button class="button is-icon text-muted" onclick={(e) => removePinnedFolder(e, folder)} title="Unpin" aria-label={`Unpin ${getFolderName(folder)}`}>
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>
						</button>
					</header>
					<div class="card border">
						<div class="scroll-y min0 box">
							{#if !folderFiles[folder]}
								<div class="border border-dashed blank pad-sm text-xs text-muted ta-c">Loading…</div>
							{:else if folderFiles[folder].length === 0}
								<div class="border border-dashed blank pad-sm text-xs text-muted ta-c">No markdown files</div>
							{:else}
								{#each folderFiles[folder] as file (file.path)}
									<button class="gap-3xs text-sm text-secondary row ycenter gap-xs wfull pad-x-xs pad-y-2xs ta-l border-bottom cursor-pointer" onclick={() => openFile(file.path)}>
										<span class="text-muted shrink-0" aria-hidden="true">
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
</div>
