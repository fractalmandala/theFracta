// src/lib/app-state.svelte.ts
export type AppView = 'notes' | 'bench' | 'agents' | 'canvas' | 'wiki' | 'studio';

const VALID_VIEWS: AppView[] = ['notes', 'bench', 'agents', 'canvas', 'wiki', 'studio'];

// The surfaces that actually render something. 'agents' and 'canvas' are
// declared but unbuilt, and the title bar no longer offers them — so a value
// stored back when it did would strand the app on the placeholder page. A
// stored view outside this set heals itself on next launch.
const BUILT_VIEWS: AppView[] = ['notes', 'bench', 'wiki', 'studio'];
const STORAGE_KEY = 'active_app_view';

function getInitialView(): AppView {
	const stored = localStorage.getItem(STORAGE_KEY) as AppView | null;
	if (!stored || !VALID_VIEWS.includes(stored)) return 'notes';
	return BUILT_VIEWS.includes(stored) ? stored : 'notes';
}

class ActiveViewState {
	current = $state<AppView>(getInitialView());

	set(view: AppView) {
		this.current = view;
		localStorage.setItem(STORAGE_KEY, view);
	}

	is(view: AppView) {
		return this.current === view;
	}
}

export const activeView = new ActiveViewState();