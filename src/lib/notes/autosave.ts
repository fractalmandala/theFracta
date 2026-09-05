/**
 * Writing edits to disk as they are made.
 *
 * # What it will not do
 *
 * - **Write a document that has no location.** A new, pasted or fetched
 *   document has nowhere to go, and the answer to that must never be a file
 *   dialog opening mid-keystroke. Those stay on Cmd+S.
 * - **Write over a file that changed underneath the edit.** When the watcher
 *   reports content that disagrees with the unsaved draft, the tab is marked
 *   conflicted and this stops writing it until the user chooses a side.
 *   Autosave without that check is a way to lose whatever the other writer —
 *   a sync client, a git checkout, another editor — had just put there.
 * - **Write on every keystroke.** Typing is debounced; a long uninterrupted
 *   burst is still flushed by the ceiling below, so a paragraph typed without
 *   pausing does not sit unsaved indefinitely.
 *
 * # Failure is visible
 *
 * A failed write sets an error the surface shows and leaves the tab dirty, so
 * the document is never presented as saved when it is not. It is not retried on
 * a timer — a read-only file or a full disk would retry forever — but the next
 * edit tries again, which is the natural retry.
 */
import { get, writable } from 'svelte/store';
import { settings } from '$lib/stores/settings';
import { tabStore, type Tab } from '$lib/stores/tabs';
import { isOnDisk, writeDraft } from '$lib/tauri/files';

/** Quiet period after the last keystroke before writing. */
const IDLE_MS = 800;
/** Longest a pending change may wait while the user keeps typing. */
const MAX_WAIT_MS = 4000;

export type AutosaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export type AutosaveStatus = {
	state: AutosaveState;
	/** The document this is about, so a stale status cannot be shown for another. */
	filePath: string | null;
	error: string | null;
	at: number;
};

export const autosaveStatus = writable<AutosaveStatus>({
	state: 'idle',
	filePath: null,
	error: null,
	at: 0
});

let timer: ReturnType<typeof setTimeout> | null = null;
let ceiling: ReturnType<typeof setTimeout> | null = null;
let pendingTabId: string | null = null;
/** The write currently in flight, so a flush can wait for it. */
let inFlight: Promise<void> | null = null;

function clearTimers(): void {
	if (timer) clearTimeout(timer);
	if (ceiling) clearTimeout(ceiling);
	timer = null;
	ceiling = null;
}

function status(state: AutosaveState, filePath: string | null, error: string | null = null): void {
	autosaveStatus.set({ state, filePath, error, at: Date.now() });
}

/** Whether this tab is one autosave is allowed to write right now. */
export function autosaveEligible(tab: Tab): boolean {
	return get(settings).autosave && isOnDisk(tab.filePath) && tab.dirty && tab.conflict === null;
}

async function writeNow(tabId: string): Promise<void> {
	clearTimers();
	pendingTabId = null;
	// Re-read the tab rather than closing over it: between scheduling and
	// firing, the draft has usually changed and may have been saved already.
	const tab = get(tabStore.tabs).find((t) => t.id === tabId);
	if (!tab) return;
	if (!autosaveEligible(tab)) {
		// Already written by an explicit save while this was waiting.
		if (!tab.dirty) status('saved', tab.filePath);
		return;
	}
	status('saving', tab.filePath);
	const write = writeDraft(tab)
		.then(() => {
			status('saved', tab.filePath);
		})
		.catch((error) => {
			// The tab stays dirty: the draft is still only in memory, and saying
			// otherwise would invite the user to close it.
			status('error', tab.filePath, error instanceof Error ? error.message : String(error));
		})
		.finally(() => {
			inFlight = null;
		});
	inFlight = write;
	await write;
}

/**
 * Note that the draft changed.
 *
 * Resets the idle timer, and starts the ceiling on the first change of a burst
 * so continuous typing still reaches disk.
 */
export function scheduleAutosave(tabId: string): void {
	const tab = get(tabStore.tabs).find((t) => t.id === tabId);
	if (!tab || !autosaveEligible(tab)) return;

	if (pendingTabId && pendingTabId !== tabId) {
		// The user moved to another document mid-burst; do not leave the first
		// one's changes waiting behind the second's timer.
		void writeNow(pendingTabId);
	}

	pendingTabId = tabId;
	if (timer) clearTimeout(timer);
	timer = setTimeout(() => void writeNow(tabId), IDLE_MS);
	if (!ceiling) ceiling = setTimeout(() => void writeNow(tabId), MAX_WAIT_MS);
	status('pending', tab.filePath);
}

/**
 * Write anything pending and wait for it.
 *
 * Called at the points where the edit stops being the thing on screen — a tab
 * switch, leaving edit mode, closing the window — so a draft is never left in
 * memory while its document is out of view.
 */
export async function flushAutosave(): Promise<void> {
	const id = pendingTabId;
	clearTimers();
	if (id) await writeNow(id);
	if (inFlight) await inFlight;
}

/** Drop a pending write, e.g. when its tab is closing without saving. */
export function cancelAutosave(tabId: string): void {
	if (pendingTabId !== tabId) return;
	clearTimers();
	pendingTabId = null;
}
