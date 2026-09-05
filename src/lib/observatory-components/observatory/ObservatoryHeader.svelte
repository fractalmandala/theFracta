<script lang="ts">
	import {
		ALL_TOKEN_TYPES,
		observatory,
		type ObservatoryTab,
		type UsageTokenType,
	} from "$lib/observatory-state/observatory.svelte";
	import SurfaceActions from "$lib/components/SurfaceActions.svelte";
	import {
		importArchive,
		type ImportSource,
	} from "$lib/observatory-fractorches";
	import { Icon } from "fractalicons";
	import { luRefreshCw } from "fractalicons/lucide";
	import { phExport } from "fractalicons/phosphor";
	import Dropdown from '$lib/components/Dropdown.svelte'

	const tabs: Array<{ id: ObservatoryTab; label: string }> = [
		{ id: "sessions", label: "Sessions" },
		{ id: "usage", label: "Usage" },
		{ id: "activity", label: "Activity" },
		{ id: "trends", label: "Trends" },
		{ id: "quality", label: "Quality" },
		{ id: "recalls", label: "Recall" },
		{ id: "pinned", label: "Pinned" },
		{ id: "recent_edits", label: "Recent" },
		{ id: "data", label: "Data" },
	];

	// --- Usage chrome -----------------------------------------------------------
	// Cost and tokens are two readings of the same rows, and the token-type
	// picker narrows the second one. Both govern every panel on the Usage tab,
	// so they belong to the surface rather than to any single dashboard — and
	// they are absent entirely on the tabs they would not affect.
	const tokenTypeLabels: Record<UsageTokenType, string> = {
		input: "Input",
		cache_write: "Cache writes",
		cache_read: "Cache reads",
		output: "Output",
	};

	function toggleTokenType(type: UsageTokenType) {
		const current = observatory.usageTokenTypes;
		observatory.setUsageTokenTypes(
			current.includes(type)
				? current.filter((row) => row !== type)
				: [...current, type],
		);
	}

	// --- Archive import ---------------------------------------------------------
	// ChatGPT and Claude.ai conversations are the only sessions Fractorches
	// cannot find by scanning: every other provider is read from logs on disk, so
	// any instance sees them. An imported archive exists solely in the database it
	// was imported into — which is exactly why Fracta needs its own way in rather
	// than depending on another app having done it once.
	let importing = $state<ImportSource | null>(null);
	let importResult = $state<string | null>(null);
	let importError = $state<string | null>(null);
	let picker = $state<HTMLInputElement | null>(null);
	let pendingSource = $state<ImportSource>("chatgpt");

	function chooseArchive(source: ImportSource) {
		pendingSource = source;
		importResult = null;
		importError = null;
		picker?.click();
	}

	async function runImport(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		// Cleared immediately so re-picking the same file fires change again.
		input.value = "";
		if (!file) return;
		importing = pendingSource;
		importError = null;
		importResult = null;
		try {
			const result = await importArchive(pendingSource, file);
			const parts = [
				`${result.imported.toLocaleString()} imported`,
				...(result.updated > 0
					? [`${result.updated.toLocaleString()} updated`]
					: []),
				...(result.skipped > 0
					? [`${result.skipped.toLocaleString()} skipped`]
					: []),
			];
			if (result.errors > 0) {
				// A failed archive still returns HTTP 200. Reporting only the
				// imported count would present a total failure as a quiet success.
				importError = `${result.errors.toLocaleString()} conversation${
					result.errors === 1 ? "" : "s"
				} could not be read — ${parts.join(", ")}.`;
			} else {
				importResult = parts.join(", ") + ".";
			}
			// The archive's sessions are new rows, so every open dashboard is now
			// stale.
			await observatory.refresh();
		} catch (error) {
			importError =
				error instanceof Error ? error.message : String(error);
		} finally {
			importing = null;
		}
	}
</script>

<!--
  The Observatory's chrome, and nothing else. Its controls — which view, over
  what range, and the two actions — render into the app header, because they
  belong to the surface rather than to any dashboard, and that is where every
  other surface puts the same thing.

  The summary strip that used to sit beneath this is gone. It restated figures
  the Sessions Overview panel already showed, in a band that cost every
  dashboard a slice of height on every tab. Its two unique figures — output
  tokens and spend — moved into that panel; Usage carries them in more detail.

  "More filters" is gone as a button too. It opened a right-hand panel, and the
  app header already has a right-panel toggle that drives whichever rail the
  current surface has mounted. Two controls for one panel is one too many.
-->
<SurfaceActions>
	<nav
		class="row ycenter gap-sm scroll-x pad-left-sm"
		aria-label="Observatory views"
	>
		{#each tabs as tab}
			<button
				class="button small ghost tt-u"
				class:active={observatory.activeTab === tab.id}
				aria-current={observatory.activeTab === tab.id
					? "page"
					: undefined}
				onclick={() => {
					observatory.activeTab = tab.id;
					observatory.clearSelectedSession();
				}}
			>
				<span class="weight-500">{tab.label}</span>
			</button>
		{/each}
	</nav>

	<div class="row ycenter gap-xs shrink-0">
		{#if observatory.activeTab === "usage"}
			<div
				class="segmented shrink-0"
				role="group"
				aria-label="Read usage as"
			>
				<button
					class="segmented-item"
					class:active={observatory.usageMode === "cost"}
					onclick={() => observatory.setUsageMode("cost")}
					>Cost</button
				>
				<button
					class="segmented-item"
					class:active={observatory.usageMode === "token"}
					onclick={() => observatory.setUsageMode("token")}
					>Tokens</button
				>
			</div>
			{#if observatory.usageMode === "token"}
				<div
					class="segmented shrink-0"
					role="group"
					aria-label="Token types counted"
				>
					{#each ALL_TOKEN_TYPES as type (type)}
						{@const selected =
							observatory.usageTokenTypes.includes(type)}
						<button
							class="segmented-item tip"
							class:active={selected}
							data-tip={selected &&
							observatory.usageTokenTypes.length === 1
								? "At least one token type stays selected"
								: `Count ${tokenTypeLabels[type].toLowerCase()}`}
							aria-pressed={selected}
							aria-disabled={selected &&
							observatory.usageTokenTypes.length === 1
								? "true"
								: undefined}
							onclick={() => toggleTokenType(type)}
							>{tokenTypeLabels[type]}</button
						>
					{/each}
				</div>
			{/if}
		{/if}
		<label
			class="row ycenter gap-3xs text-xs text-muted shrink-0 tip"
			data-tip="Time range"
		>
			<span>Range</span>
		<div class="select-compact">
			<select
				bind:value={observatory.timeRange}
				onchange={() => observatory.applyFilters()}
			>
				<option value="week">7d</option>
				<option value="month">30d</option>
				<option value="year">1y</option>
			</select>
		</div>
		</label>
		<Dropdown items={observatory.availableProjects}/>
		<label
			class="row ycenter gap-3xs text-xs text-muted shrink-0 tip"
			data-tip="Filter by project"
		>
			<span>Project</span>
			<select
				class="select select-compact text-xs mono"
				bind:value={observatory.selectedProject}
				onchange={() => observatory.applyFilters()}
			>
				<option value="all">all</option>
				{#each observatory.availableProjects as project}<option
						value={project}>{project}</option
					>{/each}
			</select>
		</label>
		<label
			class="row ycenter gap-3xs text-xs text-muted shrink-0 tip"
			data-tip="Filter by model"
		>
			<span>Model</span>
			<select
				class="select select-compact text-xs mono"
				bind:value={observatory.selectedModel}
				onchange={() => observatory.applyFilters()}
			>
				<option value="all">all</option>
				{#each observatory.availableModels as model}<option
						value={model}>{model}</option
					>{/each}
			</select>
		</label>

		<button
			class="button is-icon solid tip"
			onclick={() => observatory.refresh()}
			disabled={observatory.loading || observatory.syncing}
			data-tip="Refresh"
		>
			<Icon icon={luRefreshCw} size={16} />
		</button>
		<button
			class="button is-icon solid tip"
			onclick={() => observatory.exportSessionsCSV()}
			data-tip="Export"
		>
			<Icon icon={phExport} size={17} />
		</button>
		<!-- The native picker, kept out of the layout. -->
		<input
			bind:this={picker}
			type="file"
			accept=".zip,.json"
			hidden
			onchange={runImport}
		/>
	</div>
</SurfaceActions>

{#if importResult || importError}
	<!--
	  An import changes the dataset every dashboard below is drawn from, so its
	  outcome is stated on the surface rather than left to a transient toast.
	-->
	<p
		class="shrink-0 pad-x-sm pad-y-2xs text-xs border-bottom"
		class:text-danger={!!importError}
		class:text-muted={!importError}
	>
		{importError ?? importResult}
	</p>
{/if}
