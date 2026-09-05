// The header's surface-actions area: the controls the active surface wants in
// the title bar rather than in its own chrome.
//
// The distinction a surface should draw is between actions that bring work in —
// New Document, Open, Paste, URL — and actions that operate on the work already
// open. The first kind is meaningful the moment you arrive on the surface, with
// nothing loaded, so it belongs in the always-present header. The second kind is
// meaningless without a document, so it stays in the surface's own row and
// disappears with the document.
//
// Same registry shape as railState: a surface claims the slot while mounted, and
// release is guarded by token because surfaces swap in and out and the outgoing
// surface's cleanup can run after the incoming one has registered.

import type { Snippet } from 'svelte';

class SurfaceActions {
	current = $state<Snippet | null>(null);

	set(snippet: Snippet): () => void {
		this.current = snippet;
		return () => {
			if (this.current === snippet) this.current = null;
		};
	}
}

export const surfaceActions = new SurfaceActions();
