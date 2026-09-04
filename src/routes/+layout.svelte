<script lang="ts">
	import { onMount } from "svelte";
	import { activeView } from "$lib/states/windowState.svelte";
	import SurfaceNotes from "$lib/modules/notes/NotesModule.svelte";
	import SurfaceBench from "$lib/modules/observ/Observatory.svelte";
	import SurfaceWiki from "$lib/modules/wiki/WikiModule.svelte";
	import NotesHeaderActions from "$lib/components/NotesHeaderActions.svelte";
	import "$lib/styles/index.sass";
	import {
		initPresets,
		toggleMode,
		presets,
	} from "fractalstyler2";
	import { Icon } from "fractalicons";
	import {
		luNotebook,
		luVault,
		luBot,
		luTable,
		luBrain,
		luSun,
		luMoon,
	} from "fractalicons/lucide";
	let { children } = $props();
	let pasteVisible = $state(false);
	let pasteDefaultMode = $state<"paste" | "url">("paste");
	let openVisible = $state(false);

	const tabs = [
		{ id: "notes", icon: luNotebook },
		{ id: "bench", icon: luVault },
		{ id: "agents", icon: luBot },
		{ id: "canvas", icon: luTable },
		{ id: "wiki", icon: luBrain },
	] as const;

	// Init here rather than in the toggle: the toggle only renders on the notes
	// view, and presets plus the persisted mode should apply on every view.
	onMount(() => initPresets());

	const dark = $derived(presets.mode === "dark");
</script>


<div class="app-shell-tube">
	<div class="left-strip box xcenter">
		<div class="box in-left-strip xcenter">
			<nav class="box gap-md wfull border-bottom pad-bottom-md" aria-label="Mode">
				{#each tabs as tab}
					<button
						type="button"
						class="button small ghost"
						class:active={activeView.is(tab.id)}
						aria-label={tab.id}
						aria-current={activeView.is(tab.id)
							? "page"
							: undefined}
						title={tab.id}
						onclick={() => activeView.set(tab.id)}
					>
						<Icon icon={tab.icon} size={24} />
					</button>
				{/each}
			</nav>
			<nav class="box gap-2xs" aria-label="Actions">
				{#if activeView.is("notes")}
					<NotesHeaderActions />
					<div class="box gap-3xs">
						<button
							class="button small ghost text-xs"
							onclick={() => (openVisible = true)}>Open</button
						>
						<button
							class="button small ghost text-xs"
							onclick={() => {
								pasteDefaultMode = "paste";
								pasteVisible = true;
							}}>Paste</button
						>
						<button
							class="button small ghost text-xs"
							onclick={() => {
								pasteDefaultMode = "url";
								pasteVisible = true;
							}}>URL</button
						>
						<button
							type="button"
							class="button small ghost"
							aria-pressed={dark}
							aria-label={dark
								? "Switch to light mode"
								: "Switch to dark mode"}
							title={dark ? "Light mode" : "Dark mode"}
							onclick={() => toggleMode()}
						>
							<Icon icon={dark ? luSun : luMoon} size={16} />
						</button>
					</div>
				{/if}
			</nav>
		</div>
	</div>
	<main class="app-main">
		{#if activeView.is("notes")}
			<SurfaceNotes />
		{:else if activeView.is("bench")}
			<SurfaceBench />
		{:else if activeView.is("wiki")}
			<SurfaceWiki />
		{:else}
			{@render children()}
		{/if}
	</main>
</div>
