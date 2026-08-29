<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
</script>

<section class="box gap-md pad-md" aria-labelledby="pinned-title">
	<header class="box gap-3xs">
		<h2 id="pinned-title" class="text-lg weight-600 m-0">Pinned messages</h2>
	</header>
	<div class="box gap-2xs">
		{#each observatory.pinnedMessages as pin (pin.id)}
			<article class="card border pad-sm box gap-3xs">
				<strong class="text-sm weight-600">
					{pin.session_display_name || pin.session_first_message || pin.session_id}
				</strong>
				<p class="text-sm m-0">{pin.content || 'Pinned message content is unavailable from this record.'}</p>
				<small class="text-xs text-muted">{pin.session_project} · {pin.session_agent} · {pin.created_at}</small>
				<button class="button ghost text-xs align-self-start" onclick={() => observatory.togglePinMessage(pin)}>Unpin</button>
			</article>
		{:else}
			<p class="text-sm text-muted">No messages are pinned in Fractorches.</p>
		{/each}
	</div>
</section>
