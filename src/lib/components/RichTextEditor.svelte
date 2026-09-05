<script lang="ts">
	/**
	 * Rich-text editing, on the same markdown file as every other mode.
	 *
	 * Milkdown (via its Crepe bundle) is built on ProseMirror with remark as its
	 * parser, so the document model *is* markdown: what comes out of
	 * getMarkdown() is the file, not an HTML-to-markdown approximation. That is
	 * the whole reason for choosing it here — a tab can be opened in Rich Text,
	 * edited, switched to Raw, and the source is still the source.
	 *
	 * Only the structural half of Crepe's stylesheet is imported. Its themes are
	 * nothing but a block of custom properties on `.milkdown`, so those are
	 * declared in _08_own.sass against fractalstyler2 tokens instead — the
	 * editor then follows the palette and light/dark like everything else,
	 * rather than running a second theme system beside the contract.
	 */
	import { onMount } from 'svelte';
	import { Crepe } from '@milkdown/crepe';
	import { remarkStringifyOptionsCtx } from '@milkdown/kit/core';
	import '@milkdown/crepe/theme/common/style.css';

	let {
		value,
		onChange,
		maxWidth
	}: {
		value: string;
		onChange: (markdown: string) => void;
		maxWidth: string;
	} = $props();

	let host = $state<HTMLDivElement | undefined>();
	let crepe: Crepe | null = null;

	// What this editor last emitted. The parent writes edits back into the tab
	// buffer, which flows back down as `value`; without this the editor would
	// see its own output as an external change and reset the document (and the
	// caret with it) on every keystroke.
	// svelte-ignore state_referenced_locally
	let lastEmitted = $state(value);

	// Milkdown emits once as it mounts, when it serialises the document it was
	// just given. That emission is not an edit — it is `value` round-tripped —
	// but it rarely comes back byte-identical, so propagating it would mark a
	// file dirty merely for having been looked at in Rich Text.
	let mountEmissionSeen = false;

	// The reader's measure is a runtime setting, not a token, so it is written as
	// a custom property rather than a style attribute.
	$effect(() => {
		host?.style.setProperty('--rich-measure', maxWidth);
	});

	onMount(() => {
		if (!host) return;
		const instance = new Crepe({ root: host, defaultValue: value });

		// remark-stringify's defaults are not this app's markdown dialect, and
		// every difference shows up as a spurious diff the first time a file is
		// touched here. Pin the ones that matter to what the rest of the app and
		// the existing notes already use.
		instance.editor.config((ctx) => {
			ctx.set(remarkStringifyOptionsCtx, {
				bullet: '-',
				emphasis: '_',
				strong: '*',
				fences: true,
				rule: '-'
			});
		});

		instance.on((api) =>
			api.markdownUpdated((_ctx, markdown) => {
				if (!mountEmissionSeen) {
					mountEmissionSeen = true;
					lastEmitted = markdown;
					return;
				}
				if (markdown === lastEmitted) return;
				lastEmitted = markdown;
				onChange(markdown);
			})
		);
		crepe = instance;
		void instance.create();

		return () => {
			crepe = null;
			void instance.destroy();
		};
	});
</script>

<!--
  Crepe owns everything inside `host`, so nothing is rendered into it here.
  The wrapper is the scroll container; Crepe's own root fills it.
-->
<div class="grow min0 scroll-y bg rich-editor" bind:this={host}></div>
