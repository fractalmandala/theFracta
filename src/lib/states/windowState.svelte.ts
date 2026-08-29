// src/lib/app-state.svelte.ts
export type AppView = 'notes' | 'bench' | 'agents' | 'canvas';

const VALID_VIEWS: AppView[] = ['notes', 'bench', 'agents', 'canvas'];
const STORAGE_KEY = 'active_app_view';

function getInitialView(): AppView {
	const stored = localStorage.getItem(STORAGE_KEY) as AppView | null;
	return stored && VALID_VIEWS.includes(stored) ? stored : 'notes';
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