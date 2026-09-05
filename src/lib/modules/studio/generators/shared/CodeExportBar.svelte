<script lang="ts">
	import { suiteState } from '$lib/modules/studio/states/suite.svelte';

	interface TabItem {
		id: string;
		label: string;
	}

	let {
		tabs = [],
		activeTab = $bindable('css'),
		code = '',
		copyLabel = 'Copy'
	}: {
		tabs: TabItem[];
		activeTab: string;
		code: string;
		copyLabel?: string;
	} = $props();

	let justCopied = $state(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(code);
			justCopied = true;
			suiteState.showCopied('Code copied to clipboard!');
			setTimeout(() => {
				justCopied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy', err);
		}
	}
</script>

<div class="gen-code-bar">
	<div class="gen-code-header">
		<div class="gen-code-tabs">
			{#each tabs as tab}
				<button
					class="gen-code-tab"
					data-state={activeTab === tab.id ? 'active' : undefined}
					onclick={() => (activeTab = tab.id)}
				>
					{tab.label}
				</button>
			{/each}
		</div>
		<button class="gen-btn shrink-0" onclick={handleCopy}>
			{#if justCopied}
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="20 6 9 17 4 12"></polyline>
				</svg>
				<span class="text-success">Copied!</span>
			{:else}
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
				</svg>
				<span>{copyLabel}</span>
			{/if}
		</button>
	</div>
	<pre class="gen-code-block"><code>{code}</code></pre>
</div>
