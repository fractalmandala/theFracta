<script lang="ts">
	import ObservatoryView from '$lib/observatory-components/observatory/ObservatoryView.svelte';
</script>

<!--
  No wrapper element. A bare <div class="surface"> here was a flex item with no
  grow, so it shrank to its content width and left most of the viewport empty.
  ObservatoryView owns its own fill.
-->
<ObservatoryView />
