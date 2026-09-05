<script lang="ts">
	import { gridStore } from '$lib/modules/studio/states/grid.svelte';

	let isDragging = $state(false);
	let dragStart = $state<{ r: number; c: number } | null>(null);
	let dragCurrent = $state<{ r: number; c: number } | null>(null);
	let editingAreaId = $state<string | null>(null);
	let editingName = $state('');

	const colTracksStyle = $derived(
		gridStore.columns.map((c) => (c.unit === 'fr' ? `${c.value}fr` : `${c.value}${c.unit}`)).join(' ')
	);
	const rowTracksStyle = $derived(
		gridStore.rows.map((r) => (r.unit === 'fr' ? `${r.value}fr` : `${r.value}${r.unit}`)).join(' ')
	);

	function handleCellMouseDown(r: number, c: number) {
		isDragging = true;
		dragStart = { r, c };
		dragCurrent = { r, c };
	}

	function handleCellMouseEnter(r: number, c: number) {
		if (isDragging) {
			dragCurrent = { r, c };
		}
	}

	function handleMouseUp() {
		if (isDragging && dragStart && dragCurrent) {
			gridStore.addAreaFromSelection(
				dragStart.r,
				dragStart.c,
				dragCurrent.r,
				dragCurrent.c
			);
		}
		isDragging = false;
		dragStart = null;
		dragCurrent = null;
	}

	function isCellInDragSelection(r: number, c: number): boolean {
		if (!isDragging || !dragStart || !dragCurrent) return false;
		const minR = Math.min(dragStart.r, dragCurrent.r);
		const maxR = Math.max(dragStart.r, dragCurrent.r);
		const minC = Math.min(dragStart.c, dragCurrent.c);
		const maxC = Math.max(dragStart.c, dragCurrent.c);
		return r >= minR && r <= maxR && c >= minC && c <= maxC;
	}

	function startRename(id: string, currentName: string, e: MouseEvent) {
		e.stopPropagation();
		editingAreaId = id;
		editingName = currentName;
	}

	function commitRename(id: string) {
		if (editingName.trim()) {
			gridStore.updateAreaName(id, editingName.trim());
		}
		editingAreaId = null;
	}
</script>

<svelte:window onmouseup={handleMouseUp} />

<div class="box xcenter gap12 w100 h100">
	<div class="row xbetween w100 maxw820 text-sm text-secondary">
		<span>Drag to create areas · Click area to select · Double-click name to rename</span>
		<span class="fw600">{gridStore.columns.length} cols × {gridStore.rows.length} rows</span>
	</div>

	<!-- Interactive Grid Container -->
	<div
		class="grid-interactive-matrix"
		data-interactive
		style="--cols: {colTracksStyle}; --rows: {rowTracksStyle}; --rgap: {gridStore.rowGap}px; --cgap: {gridStore.colGap}px;"
	>
		<!-- Background Grid Cells for Drag Selection -->
		{#each Array.from({ length: gridStore.rows.length }) as _, rIdx}
			{#each Array.from({ length: gridStore.columns.length }) as __, cIdx}
				{@const r = rIdx + 1}
				{@const c = cIdx + 1}
				{@const inDrag = isCellInDragSelection(r, c)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="grid-area-cell"
					style="--cell-row: {r}; --cell-col: {c};"
					data-drag={inDrag ? 'true' : undefined}
					onmousedown={() => handleCellMouseDown(r, c)}
					onmouseenter={() => handleCellMouseEnter(r, c)}
				>
					<span class="gen-cell-label">{r}×{c}</span>
				</div>
			{/each}
		{/each}

		<!-- Overlaid Named Grid Areas -->
		{#each gridStore.areas as area (area.id)}
			{@const isActive = gridStore.activeAreaId === area.id}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="grid-named-area-block"
				style="--area-row: {area.startRow} / {area.endRow + 1}; --area-col: {area.startCol} / {area.endCol + 1}; --area-color: {area.color};"
				onclick={() => (gridStore.activeAreaId = area.id)}
				ondblclick={(e) => startRename(area.id, area.name, e)}
			>
				{#if editingAreaId === area.id}
					<input
						type="text"
						bind:value={editingName}
						onblur={() => commitRename(area.id)}
						onkeydown={(e) => e.key === 'Enter' && commitRename(area.id)}
						class="gen-area-rename"
					/>
				{:else}
					<div class="gen-area-label">
						<span>{area.name}</span>
						<span class="gen-area-size">
							{area.endCol - area.startCol + 1}×{area.endRow - area.startRow + 1}
						</span>
					</div>
				{/if}

				<!-- Delete area button -->
				<button
					class="gen-area-del"
					onclick={(e) => {
						e.stopPropagation();
						gridStore.removeArea(area.id);
					}}
					title="Remove area"
				>
					✕
				</button>
			</div>
		{/each}
	</div>
</div>
