<script lang="ts">
	import { wikiState } from "$lib/wiki/state.svelte";
	import { wikiStore } from "$lib/wiki/store.svelte";
	import { wikiCorpus } from "$lib/wiki/corpus.svelte";
	import { wikiCompile } from "$lib/wiki/compile.svelte";
	import SurfaceActions from "$lib/components/SurfaceActions.svelte";
	import Dropdown from "$lib/components/Dropdown.svelte";
	import { Icon } from "fractalicons";
	import {
		luSearch,
		luBookOpen,
		luDatabase,
		luFileText,
		luSparkles,
		luSquare,
		luCheck,
		luX,
		luTags,
		luChevronDown,
		luChevronRight,
		luFolder,
	} from "fractalicons/lucide";

	const tagMenuItems = $derived.by(() => {
		const distinct = wikiState.allTags;
		if (distinct.length === 0) {
			return [
				{
					label: "No tags available",
					disabled: true
				}
			];
		}
		return distinct.map(({ tag, count }) => {
			const isChecked = wikiState.selectedTags.includes(tag);
			return {
				label: `#${tag}`,
				shortcut: count.toString(),
				checked: isChecked,
				active: isChecked,
				keepOpen: true,
				onSelect: () => wikiState.toggleTag(tag)
			};
		});
	});

	const tagsTriggerLabel = $derived.by(() => {
		const count = wikiState.selectedTags.length;
		if (count === 0) return "Tags";
		if (count === 1) return `#${wikiState.selectedTags[0]}`;
		return `Tags (${count})`;
	});

	let searchInput = $state("");
	let expandedSections = $state<Set<string>>(new Set([
		'core-concepts',
		'systems',
		'decisions',
		'case-histories',
		'conventions',
		'projects',
		'glossary'
	]));

	function toggleSection(key: string) {
		const next = new Set(expandedSections);
		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}
		expandedSections = next;
	}

	function expandAll() {
		expandedSections = new Set(wikiState.sectionGroups.map((g) => g.key));
	}

	function collapseAll() {
		expandedSections = new Set();
	}

	function onSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		searchInput = val;
		if (wikiState.viewMode === "corpus") {
			wikiCorpus.setQuery(val);
		} else {
			wikiState.setSearch(val);
			if (val.trim()) {
				expandedSections = new Set(wikiState.sectionGroups.map((g) => g.key));
			}
		}
	}

	function selectSection(sec: string | null) {
		wikiState.setSection(sec);
	}

	function selectEntry(id: string) {
		wikiState.pick(id);
	}

	function selectCorpusEntry(id: string) {
		wikiState.pickCorpus(id);
	}

	function openCompilePanel() {
		wikiCompile.openPanel();
		wikiState.setView("compile");
	}
</script>

<aside class="box gap-sm hfull">
	<!-- Top Filter & Search Section -->
	<div class="box gap-xs">
		<!-- Search & Tag Actions -->
		<SurfaceActions>
			<div class="row ycenter pad-x-sm gap-2xs">
				<Icon icon={luSearch} size={18} />
				<input
					type="text"
					class="input ghost"
					placeholder={wikiState.viewMode === "corpus"
						? "search corpus..."
						: "search concepts..."}
					value={searchInput}
					oninput={onSearchInput}
				/>
			</div>

			<Dropdown items={tagMenuItems} align="start">
				{#snippet trigger(props)}
					<button
						type="button"
						class="button row ycenter gap-2xs text-xs"
						class:active={wikiState.selectedTags.length > 0}
						title="Filter wiki articles by tag"
						{...props}
					>
						<Icon icon={luTags} size={14} />
						<span>{tagsTriggerLabel}</span>
						<Icon icon={luChevronDown} size={12} />
					</button>
				{/snippet}

				<div class="box gap-2xs pad-xs mono text-2xs">
					<div class="row ycenter xbetween gap-xs">
						<span class="text-secondary">MATCH:</span>
						<div class="segmented">
							<button
								type="button"
								class="segmented-item text-2xs mono"
								class:active={wikiState.tagMatchMode === "any"}
								onclick={() => wikiState.setTagMatchMode("any")}
							>
								ANY
							</button>
							<button
								type="button"
								class="segmented-item text-2xs mono"
								class:active={wikiState.tagMatchMode === "all"}
								onclick={() => wikiState.setTagMatchMode("all")}
							>
								ALL
							</button>
						</div>
					</div>
					{#if wikiState.selectedTags.length > 0}
						<button
							type="button"
							class="button ghost text-2xs mono wfull text-theme pad-y-3xs"
							onclick={() => wikiState.clearTags()}
						>
							CLEAR FILTERS ({wikiState.selectedTags.length})
						</button>
					{/if}
				</div>
			</Dropdown>

			<div class="row ycenter gap-md">
				<button
					class="button is-icon row gap-3xs"
					class:active={wikiState.viewMode === "compile"}
					onclick={openCompilePanel}
					title="Compile selected corpus entries into a draft article"
				>
					<Icon icon={luSparkles} size={16} />
					<span>Compile</span>
				</button>
			</div>
		</SurfaceActions>

		<!-- Section Filter Tabs -->
		<div class="row tab-row wrap gap-3xs">
			{#if wikiState.viewMode === "corpus"}
				<button
					class="button is-tab grow"
					class:active={wikiCorpus.selectedType === null}
					onclick={() => wikiCorpus.setType(null)}
				>
					All
				</button>
				{#each wikiCorpus.availableTypes as type (type)}
					<button
						class="button is-tab grow"
						class:active={wikiCorpus.selectedType === type}
						onclick={() => wikiCorpus.setType(type)}
					>
						{type}
					</button>
				{/each}
			{:else}
				<button
					class="button is-tab"
					class:active={wikiState.selectedSection === null}
					onclick={() => selectSection(null)}
				>
					All ({wikiStore.entries.length})
				</button>
				{#each wikiState.allSections as sec (sec.key)}
					<button
						class="button is-tab"
						class:active={wikiState.selectedSection === sec.key}
						onclick={() => selectSection(wikiState.selectedSection === sec.key ? null : sec.key)}
					>
						{sec.title} ({sec.count})
					</button>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Entry List by Sections -->
	<div class="grow scroll-y box gap-sm pad-x-xs">
		{#if wikiState.viewMode === "corpus"}
			<!-- Corpus list: recall entries from the Fractorches service -->
			{#if wikiCorpus.loading && !wikiCorpus.loaded}
				<div class="box gap-3xs pad-y-sm">
					<span class="text-xs text-secondary">Loading recall corpus…</span>
				</div>
			{:else if wikiCorpus.error}
				<div class="box gap-3xs pad-y-sm">
					<span class="text-xs">Corpus unavailable</span>
					<span class="text-xs text-secondary mono">{wikiCorpus.error}</span>
					<button class="button small ghost text-xs" onclick={() => wikiCorpus.refresh()}>
						Retry
					</button>
				</div>
			{:else if wikiCorpus.entries.length === 0}
				<div class="box gap-3xs pad-y-sm">
					<Icon icon={luFileText} size={24} />
					<span class="text-xs text-secondary">
						{wikiCorpus.query.trim() || wikiCorpus.selectedType
							? "No corpus entries match this filter."
							: "The recall corpus is empty."}
					</span>
				</div>
			{:else}
				<!-- Cluster selection bar for compilation -->
				{#if wikiCorpus.selectionCount > 0}
					<div class="box gap-3xs border pad-2xs">
						<span class="text-xs text-theme">{wikiCorpus.selectionCount} selected</span>
						<div class="row gap-3xs">
							<button class="button small ghost text-xs" onclick={() => wikiCorpus.clearSelection()}>
								<Icon icon={luX} size={12} />
							</button>
							<button class="button small ghost text-xs" onclick={openCompilePanel} title="Compile cluster">
								<Icon icon={luSparkles} size={12} />
								<span>Compile</span>
							</button>
						</div>
					</div>
				{/if}
				{#each wikiCorpus.entries as entry (entry.id)}
					<div class="box gap-3xs">
						<button
							class="blank pad-0 box xleft gap-3xs grow"
							class:active={wikiState.currentCorpusId === entry.id && wikiState.viewMode === "corpus"}
							onclick={() => selectCorpusEntry(entry.id)}
						>
							<p class="text-bs text-primary">{entry.title}</p>
							<div class="row gap-3xs">
								{#if entry.agent}
									<span class="text-xs text-theme">{entry.agent}</span>
								{/if}
								{#if entry.project}
									<span class="text-xs text-secondary">{entry.project}</span>
								{/if}
								<span class="text-xs mono text-secondary">{entry.review_state}</span>
							</div>
						</button>
						<button
							class="button small ghost text-xs"
							class:active={wikiCorpus.isSelected(entry.id)}
							onclick={() => wikiCorpus.toggleSelected(entry.id)}
							title={wikiCorpus.isSelected(entry.id) ? "Remove from compile" : "Add to compile"}
						>
							<Icon icon={wikiCorpus.isSelected(entry.id) ? luCheck : luSquare} size={12} />
						</button>
					</div>
				{/each}
			{/if}
		{:else if wikiStore.loading}
			<div class="box gap-3xs pad-y-sm">
				<span class="text-xs text-secondary">Loading concepts…</span>
			</div>
		{:else if wikiStore.error}
			<div class="box gap-3xs pad-y-sm">
				<span class="text-xs">Concept store unavailable</span>
				<span class="text-xs text-secondary mono">{wikiStore.error}</span>
				<button class="button small ghost text-xs" onclick={() => wikiStore.load(true)}>
					Retry
				</button>
			</div>
		{:else if wikiStore.entries.length === 0}
			<div class="box gap-3xs pad-y-sm">
				<Icon icon={luFileText} size={24} />
				<span class="text-xs text-secondary">No wiki concepts found.</span>
			</div>
		{:else if wikiState.filteredArticles.length === 0}
			<div class="box gap-3xs pad-y-sm">
				<Icon icon={luFileText} size={24} />
				<span class="text-xs text-secondary">
					No concepts match your search or filter.
				</span>
				{#if wikiState.searchQuery || wikiState.selectedTags.length > 0 || wikiState.selectedSection}
					<button
						type="button"
						class="button small ghost text-xs text-theme"
						onclick={() => {
							wikiState.setSearch("");
							wikiState.clearTags();
							wikiState.setSection(null);
							searchInput = "";
						}}
					>
						Clear all filters
					</button>
				{/if}
			</div>
		{:else}
			<!-- Concept-wise sections -->
			{#each wikiState.sectionGroups as group (group.key)}
				{@const isExpanded = expandedSections.has(group.key)}
				<div class="box gap-2xs">
					<!-- Section Header -->
					<button
						type="button"
						class="wiki-section-header blank row ycenter xbetween pad-xs cursor-pointer wfull"
						onclick={() => toggleSection(group.key)}
						title="{isExpanded ? 'Collapse' : 'Expand'} {group.title}"
					>
						<div class="row ycenter gap-2xs grow">
							<Icon icon={isExpanded ? luChevronDown : luChevronRight} size={14} />
							<Icon icon={luFolder} size={14} />
							<span class="text-xs weight-600 text-primary tt-u mono">{group.title}</span>
						</div>
						<span class="badge radius-4 text-2xs mono">{group.count}</span>
					</button>

					<!-- Section Concept Items -->
					{#if isExpanded}
						<div class="box gap-2xs pad-left-xs">
							{#each group.entries as entry (entry.id)}
								{@const isActive = wikiState.currentEntryId === entry.id && wikiState.viewMode === "entry"}
								<button
									type="button"
									class="wiki-entry-item blank box xleft gap-3xs pad-xs cursor-pointer"
									class:active={isActive}
									onclick={() => selectEntry(entry.id)}
								>
									<div class="row ycenter gap-2xs wfull">
										<span class="wiki-status-dot {entry.status}" title="status: {entry.status}"></span>
										<p class="text-sm lh12 text-primary weight-500 truncate grow">{entry.title}</p>
									</div>
									{#if entry.tags && entry.tags.length > 0}
										<div class="row gap-3xs wrap pad-left-xs">
											{#each entry.tags.slice(0, 3) as tag}
												<span class="text-2xs text-secondary">#{tag}</span>
											{/each}
										</div>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</aside>

