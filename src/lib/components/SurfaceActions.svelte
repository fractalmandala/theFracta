<script lang="ts">
	// Declares this surface's header controls. Renders nothing where it is
	// written: the children snippet is handed to the shell, which renders it in
	// the header before the mode toggle. Writing it inside the surface keeps the
	// buttons' handlers closed over the surface's own state.
	import type { Snippet } from 'svelte';
	import { surfaceActions } from '$lib/states/surfaceActions.svelte';

	let { children }: { children: Snippet } = $props();

	$effect(() => surfaceActions.set(children));
</script>
