<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	let summary = $derived(observatory.overview);
</script>

<section class="box gap-md pad-md">
	<header class="box gap-3xs">
		<p class="eyebrow text-xs">Sessions</p>
		<h2 class="text-lg weight-600 m-0">Overview</h2>
	</header>

	{#if summary}
		<dl class="metrics-grid">
			<div class="metric-item card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Sessions</dt>
				<dd class="text-md weight-600 m-0">{summary.total_sessions}</dd>
			</div>
			<div class="metric-item card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Messages</dt>
				<dd class="text-md weight-600 m-0">{summary.total_messages}</dd>
			</div>
			<div class="metric-item card border pad-sm box gap-3xs">
				<dt class="text-xs weight-500 text-muted tt-u">Projects</dt>
				<dd class="text-md weight-600 m-0">{summary.active_projects}</dd>
			</div>
			<div class="metric-item card border pad-sm box gap-3xs">
				<dt class="text-xs weight-600 text-muted tt-u">Active days</dt>
				<dd class="text-md weight-600 m-0">{summary.active_days}</dd>
			</div>
		</dl>
	{:else}
		<p class="text-muted text-sm">Summary is unavailable.</p>
	{/if}

	<section class="box gap-2xs">
		<h3 class="text-sm weight-600 m-0">Top sessions by messages</h3>
		<ol class="reset-list box gap-3xs">
			{#each observatory.topSessions as item (item.id)}
				<li class="row ycenter gap-2xs pad-x-2xs pad-y-3xs border-bottom text-sm">
					<button class="link text-left grow min0 truncate" onclick={() => observatory.selectSession(item.id)}>
						{item.display_name || item.first_message || item.id}
					</button>
					<span class="text-muted shrink-0">{item.message_count} messages</span>
				</li>
			{:else}
				<li class="text-sm text-muted">No top sessions were reported.</li>
			{/each}
		</ol>
	</section>
</section>
