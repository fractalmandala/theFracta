<script lang="ts">
	import { activeView } from "$lib/states/windowState.svelte";
	import SurfaceNotes from "$lib/modules/notes/NotesModule.svelte";
	import SurfaceBench from "$lib/modules/observ/Observatory.svelte";
	import { Icon } from "fractalicons";
	import { luFilePlus } from "fractalicons/lucide";
	import { newDocument } from "$lib/tauri/files";
	import "$lib/styles/index.sass";
	import { ThemeScript, AuraBackground, ThemePicker } from "fractalthemer";
	import "fractalthemer/styles.css";

	let { children } = $props();

	const tabs = ["notes", "bench", "agents", "canvas"] as const;
</script>

<ThemeScript />
<AuraBackground />

<div class="app-shell">
	<header class="app-header row ycenter xbetween gap-md pad-x-sm">
		<nav class="row ycenter gap-md" aria-label="Mode">
			{#each tabs as tab}
				<button
					class="button small text-sm tt-u"
					class:active={activeView.is(tab)}
					onclick={() => activeView.set(tab)}
				>
					{tab}
				</button>
			{/each}
		</nav>
		<nav class="row ycenter gap-2xs" aria-label="Actions">
			{#if activeView.is("notes")}
				<button class="button is-icon" onclick={newDocument} title="New document" aria-label="New document">
					<Icon icon={luFilePlus} size={16} />
				</button>
			{/if}
			<ThemePicker />
		</nav>
	</header>

	<main class="app-main">
		{#if activeView.is("notes")}
			<SurfaceNotes />
		{:else if activeView.is("bench")}
			<SurfaceBench />
		{:else}
			{@render children()}
		{/if}
	</main>
</div>
