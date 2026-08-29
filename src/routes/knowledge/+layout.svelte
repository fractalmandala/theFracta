<script lang="ts">
	import { onMount } from 'svelte';
	import katexCss from 'katex/dist/katex.min.css?inline';
	import highlightCss from 'highlight.js/styles/github.min.css?inline';
	let { children } = $props();

</script>

{@render children()}
