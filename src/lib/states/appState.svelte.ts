// Application-scoped UI state.
//
// Settings and About describe the app, not the document open in Notes, so they
// live here rather than in notesState. Keeping them in the Notes module meant
// they were unreachable from Observatory and Wiki, and it left Cmd+, bound to a
// local variable that nothing rendered.

class AppState {
	settingsVisible = $state(false);
	aboutVisible = $state(false);

	/** True while any app-level dialog owns the screen. */
	get anyDialogVisible(): boolean {
		return this.settingsVisible || this.aboutVisible;
	}

	openSettings() {
		this.aboutVisible = false;
		this.settingsVisible = true;
	}

	toggleSettings() {
		const next = !this.settingsVisible;
		this.aboutVisible = false;
		this.settingsVisible = next;
	}

	openAbout() {
		this.settingsVisible = false;
		this.aboutVisible = true;
	}

	closeDialogs() {
		this.settingsVisible = false;
		this.aboutVisible = false;
	}
}

export const appState = new AppState();
