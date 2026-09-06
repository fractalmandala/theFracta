<script lang="ts">
	import { activeView } from "$lib/states/windowState.svelte";

	/**
	 * The route for `/`, which is the URL Tauri loads.
	 *
	 * Without this file SvelteKit had no page for `/` and answered every launch
	 * with a 404 — visible as the repeated `[404] GET /` in the dev log. The app
	 * still looked right because +layout.svelte renders a surface from
	 * activeView and never reached {@render children()}, so the error page sat
	 * underneath, unseen.
	 *
	 * This page IS that else-branch: it shows only when the active view is one
	 * the app declares but has not built yet.
	 */
	const label = $derived(
		activeView.is("agents") ? "Agents" : activeView.is("canvas") ? "Canvas" : "This surface",
	);
</script>

<div class="box ycenter xcenter gap-sm pad-2xl grow ta-c">
	<h1 class="text-xl weight-600 title-tight">{label} isn't built yet</h1>
	<p class="text-sm text-muted content-shell">
		Notes, Bench and Wiki are the surfaces that exist today. Pick one from the
		title bar, or press ⌘1, ⌘2 or ⌘3.
	</p>
	<button class="button small ghost" onclick={() => activeView.switch("notes")}>Go to Notes</button>
</div>
