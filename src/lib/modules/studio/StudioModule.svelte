<script lang="ts">

	import Rail from "$lib/components/Rail.svelte";
	import PreviewPanel from '$lib/modules/studio/PreviewPanel.svelte'
	import Sidebar from '$lib/modules/studio/Sidebar.svelte'
	import EditorPanel from '$lib/modules/studio/EditorPanel.svelte'
	import DetailsPanel from '$lib/modules/studio/DetailsPanel.svelte'

</script>

<div class="row wfull grow min0 hfull">
	<Rail
		id="studio"
		side="left"
		label="studio-left"
		initial={320}
		min={240}
		max={560}
	>
		<div class="row hfull">
			<Sidebar/>
			<EditorPanel/>
		</div>
	</Rail>
	<section class="page-main grow">
		<PreviewPanel/>
	</section>
	<Rail
		id="studio2"
		side="right"
		label="studio-right"
		initial={250}
		min={200}
		max={360}
	>
		<DetailsPanel/>
	</Rail>
</div>
