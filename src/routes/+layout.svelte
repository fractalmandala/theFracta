<script lang="ts">
	import { onMount } from "svelte";
	import { activeView } from "$lib/states/windowState.svelte";
	import { appState } from "$lib/states/appState.svelte";
	import SettingsDialog from "$lib/components/SettingsDialog.svelte";
	import AboutDialog from "$lib/components/AboutDialog.svelte";
	import SurfaceNotes from "$lib/modules/notes/NotesModule.svelte";
	import SurfaceBench from "$lib/modules/observ/Observatory.svelte";
	import SurfaceWiki from "$lib/modules/wiki/WikiModule.svelte";
	import NotesHeaderActions from "$lib/components/NotesHeaderActions.svelte";
	import "$lib/styles/index.sass";
	import {
		initPresets,
		toggleMode,
		presets,
		ThemePicker,
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
		luSettings,
		luInfo,
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

	// Presets and the persisted mode apply on every view, so the runtime is
	// initialised by the shell rather than by whichever control happens to mount.
	onMount(() => initPresets());

	const dark = $derived(presets.mode === "dark");

	// Cmd+, is the platform convention for preferences. It is bound at the shell
	// because Settings is app-scoped: it has to answer on Observatory and Wiki,
	// not only where a document happens to be open.
	function onKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key === ",") {
			event.preventDefault();
			appState.toggleSettings();
		} else if (event.key === "Escape" && appState.anyDialogVisible) {
			appState.closeDialogs();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />


<div class="app-shell-tube">
	<div class="left-strip box xcenter">
		<div class="box in-left-strip xcenter">
			<!-- Zone 1 — the surfaces. -->
			<nav class="strip-surfaces box gap-md wfull border-bottom pad-bottom-md" aria-label="Mode">
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
			<!--
			  Zone 2 — actions for the surface in view. Everything here acts on a
			  document, so it belongs to Notes and disappears with it.
			-->
			<nav class="strip-actions box gap-2xs scroll-y" aria-label="Surface actions">
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
					</div>
				{/if}
			</nav>

			<!--
			  Zone 3 — controls that belong to the app rather than to a surface.
			  Pinned to the foot of the strip, which is present on every view, so
			  they are reachable from Observatory and Wiki too. The mode toggle used
			  to live inside the Notes block, which left the other two surfaces with
			  no way to change theme at all.
			-->
			<nav class="strip-globals box xcenter gap-2xs wfull border-top pad-top-sm" aria-label="Application">
				<!-- The strip already carries a dedicated mode toggle beside it. -->
				<ThemePicker showModeToggle={false} />
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
					<Icon icon={dark ? luSun : luMoon} size={20} />
				</button>
				<button
					type="button"
					class="button small ghost"
					aria-haspopup="dialog"
					aria-expanded={appState.settingsVisible}
					aria-label="Settings"
					title="Settings (⌘,)"
					onclick={() => appState.toggleSettings()}
				>
					<Icon icon={luSettings} size={20} />
				</button>
				<button
					type="button"
					class="button small ghost"
					aria-haspopup="dialog"
					aria-expanded={appState.aboutVisible}
					aria-label="About Fracta"
					title="About Fracta"
					onclick={() => appState.openAbout()}
				>
					<Icon icon={luInfo} size={20} />
				</button>
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

<!-- App-scoped dialogs live at the shell, so every surface can open them. -->
<SettingsDialog bind:visible={appState.settingsVisible} />
<AboutDialog bind:visible={appState.aboutVisible} />
