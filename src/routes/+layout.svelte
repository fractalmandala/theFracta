<script lang="ts">
	import { onMount, tick } from "svelte";
	import { activeView } from "$lib/states/windowState.svelte";
	import { appState } from "$lib/states/appState.svelte";
	import { railState } from "$lib/states/railState.svelte";
	import { appFonts } from "$lib/states/appFonts.svelte";
	import { surfaceActions } from "$lib/states/surfaceActions.svelte";
	import SettingsDialog from "$lib/components/SettingsDialog.svelte";
	import AboutDialog from "$lib/components/AboutDialog.svelte";
	import SurfaceNotes from "$lib/modules/notes/NotesModule.svelte";
	import SurfaceBench from "$lib/modules/observ/Observatory.svelte";
	import SurfaceWiki from "$lib/modules/wiki/WikiModule.svelte";
	import SurfaceStudio from "$lib/modules/studio/StudioModule.svelte";
	import "$lib/styles/index.sass";
	import {
		initPresets,
		toggleThemeMode,
		presets,
		getPresetScript
	} from "fractalstyler2";
	import { Icon } from "fractalicons";
	import {
		luSun,
		luMoon,
		luSettings,
		luPanelRight,
		luPanelLeft,
	} from "fractalicons/lucide";
	let { children } = $props();
	let isDark = $state(false);

	function applyMode() {
		toggleThemeMode();
		isDark = document.documentElement.getAttribute('data-mode') === 'dark';
	}

	async function toggle() {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced || typeof document.startViewTransition !== 'function') {
			applyMode();
			return;
		}

		const transition = document.startViewTransition(async () => {
			applyMode();
			await tick();
		});

		try {
			await transition.ready;
		} catch {
			return;
		}

		// isDark is the mode we just swapped to. Going dark, the incoming
		// snapshot starts as a band at the top and grows down; going light, it
		// starts at the bottom and grows up.
		const from = isDark ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)';

		document.documentElement.animate(
			{ clipPath: [from, 'inset(0 0 0 0)'] },
			{
				duration: 750,
				easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
				pseudoElement: '::view-transition-new(root)'
			}
		);
	}

	// Labels, not glyphs: luVault for Bench and luBrain for Wiki were always a
	// guess, and a horizontal bar can afford words. Agents and Canvas are not
	// built yet, so the switcher does not advertise them.
	const surfaces = [
		{ id: "notes", label: "Notes" },
		{ id: "bench", label: "Bench" },
		{ id: "wiki", label: "Wiki" },
		{ id: "studio", label: "Studio" },
	] as const;

	// What the header says you are looking at. Each surface owns its own second
	// row; this is only the one-line answer to "where am I".
	const context = $derived(
		activeView.is("notes")
			? "Notes"
			: activeView.is("bench")
				? "Observatory"
				: activeView.is("wiki")
					? "Wiki"
					: activeView.is("studio")
						? "Studio"
						: "",
	);

	// Presets and the persisted mode apply on every view, so the runtime is
	// initialised by the shell rather than by whichever control happens to mount.
	onMount(() => {
		// Stored fonts are already stamped pre-paint by app.html; this reads them
		// into state and fetches the installed families for Settings.
		void appFonts.load();
		initPresets();
		isDark = document.documentElement.getAttribute('data-mode') === 'dark';
	});

	/**
	 * toggleThemeMode, not toggleMode.
	 *
	 * A palette class on <html> sets the same surface tokens as [data-mode] at
	 * equal specificity and later source order, so it wins: with a theme applied,
	 * toggleMode flips the attribute and nothing on screen changes. Measured with
	 * theme-light-default, light and dark both render rgb(255,255,255).
	 *
	 * toggleThemeMode swaps to the palette's light/dark twin instead, and falls
	 * back to a plain mode flip when no palette is applied. Every one of the 76
	 * palettes in 0.8.0 is twinned, so there is always a counterpart to swap to.
	 */

	// Cmd+, is the platform convention for preferences. It is bound at the shell
	// because Settings is app-scoped: it has to answer on Observatory and Wiki,
	// not only where a document happens to be open.
	function onKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key === ",") {
			event.preventDefault();
			appState.toggleSettings();
		} else if (event.key === "Escape" && appState.anyDialogVisible) {
			appState.closeDialogs();
		} else if (
			(event.metaKey || event.ctrlKey) &&
			/^[1-9]$/.test(event.key)
		) {
			const surface = surfaces[Number(event.key) - 1];
			if (surface) {
				event.preventDefault();
				activeView.switch(surface.id);
			}
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />
<svelte:head>
	{@html `<script>${getPresetScript()}<\/script>`}
</svelte:head>
<!--
  Canonical app-shell markup: header over main, per fractalstyler2's
  canonical-markups.md. The window is configured with titleBarStyle "Overlay"
  and hiddenTitle, so this header IS the title bar — which is why the traffic
  lights get a reserved inset instead of a column to duck around.
-->
<div class="app-shell">
	<header
		class="app-header box wfull"
	>
		<div class="top-strip wfull" data-tauri-drag-region></div>
		<div class="header-strip row xbetween row ycenter gap-sm wfull hfull">
		<nav class="row ycenter gap-md hfull" aria-label="Surface">
			<button
				type="button"
				class="button is-icon solid"
				aria-disabled={!railState.has("left")}
				aria-pressed={railState.has("left") &&
					!railState.collapsedOn("left")}
				aria-label={railState.has("left")
					? railState.collapsedOn("left")
						? `Show ${railState.labelFor("left")}`
						: `Hide ${railState.labelFor("left")}`
					: "No left sidebar on this surface"}
				data-tip={railState.has("left")
					? railState.labelFor("left")
					: "No left sidebar"}
				onclick={() => railState.toggle("left")}
			>
				<Icon icon={luPanelLeft} size={16} />
			</button>
			{#each surfaces as surface, i}
				<button
					type="button"
					class="button header-nav"
					class:active={activeView.is(surface.id)}
					aria-current={activeView.is(surface.id)
						? "page"
						: undefined}
					data-tip="{surface.label} (⌘{i + 1})"
					onclick={() => activeView.switch(surface.id)}
					>{surface.label}</button
				>
			{/each}
		</nav>
		<nav class="row ycenter gap-sm min0 hfull" aria-label="Application">
			<div
				class="row ycenter gap-sm pad-right-sm grow min0" class:dynamic-header={surfaceActions.current}
				role="group"
				aria-label="{context} actions"
			>
				{#if surfaceActions.current}{@render surfaceActions.current()}{/if}
			</div>
			<div class="row ycenter gap-sm shrink-0 header-right-buttons">
			<button
				type="button"
				class="button is-icon solid tip"
				aria-pressed={isDark}
				aria-label={isDark
					? "Switch to light mode"
					: "Switch to dark mode"}
				data-tip={isDark ? "Light mode" : "Dark mode"}
				onclick={toggle}
			>
				<Icon icon={isDark ? luSun : luMoon} size={16} />
			</button>
			<button
				type="button"
				class="button is-icon solid tip"
				aria-haspopup="dialog"
				aria-expanded={appState.settingsVisible}
				aria-label="Settings"
				data-tip="Settings (⌘,)"
				onclick={() => appState.toggleSettings()}
			>
				<Icon icon={luSettings} size={16} />
			</button>
			<button
				type="button"
				class="button is-icon solid tip tip-end"
				aria-disabled={!railState.has("right")}
				aria-pressed={railState.has("right") &&
					!railState.collapsedOn("right")}
				aria-label={railState.has("right")
					? railState.collapsedOn("right")
						? `Show ${railState.labelFor("right")}`
						: `Hide ${railState.labelFor("right")}`
					: "No right sidebar on this surface"}
				data-tip={railState.has("right")
					? railState.labelFor("right")
					: "No right sidebar"}
				onclick={() => railState.toggle("right")}
			>
				<Icon icon={luPanelRight} size={16} />
			</button>
			</div>
		</nav>
		</div>
	</header>
	<main class="app-main">
		{#if activeView.is("notes")}
			<SurfaceNotes />
		{:else if activeView.is("bench")}
			<SurfaceBench />
		{:else if activeView.is("wiki")}
			<SurfaceWiki />
		{:else if activeView.is("studio")}
			<SurfaceStudio />
		{:else}
			{@render children()}
		{/if}
	</main>
</div>
<!-- App-scoped dialogs live at the shell, so every surface can open them. -->
<SettingsDialog bind:visible={appState.settingsVisible} />
<AboutDialog bind:visible={appState.aboutVisible} />
