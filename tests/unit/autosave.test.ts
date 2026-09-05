import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

/**
 * Autosave writes the user's real files without being asked, so what is tested
 * here is mostly what it *refuses* to do: write a document with no location,
 * write over a file that changed underneath the edit, or claim success after a
 * failed write.
 *
 * The filesystem is mocked at `writeDraft`, the single write path — the layer
 * below it is Tauri and belongs to an integration test, not this one.
 */

const writeDraft = vi.fn<(tab: unknown) => Promise<void>>();

vi.mock('$lib/tauri/files', () => ({
	writeDraft: (tab: unknown) => writeDraft(tab),
	isOnDisk: (path: string) =>
		!!path &&
		!path.startsWith('paste://') &&
		!path.startsWith('url://') &&
		!path.startsWith('new://')
}));

const { autosaveStatus, cancelAutosave, flushAutosave, scheduleAutosave } = await import(
	'$lib/notes/autosave'
);
const { tabStore } = await import('$lib/stores/tabs');
const { settings } = await import('$lib/stores/settings');

/** Put one tab in the store and return its id. */
function openTab(filePath: string, content = 'saved'): string {
	tabStore.tabs.set([]);
	const id = tabStore.addTab(filePath, filePath.split('/').pop() ?? filePath, content, '<p></p>');
	return id;
}

function edit(id: string, text: string): void {
	tabStore.setEditing(id, true);
	tabStore.updateEditContent(id, text);
}

beforeEach(() => {
	vi.useFakeTimers();
	writeDraft.mockReset();
	writeDraft.mockResolvedValue(undefined);
	settings.update((s) => ({ ...s, autosave: true }));
	autosaveStatus.set({ state: 'idle', filePath: null, error: null, at: 0 });
});

afterEach(() => {
	vi.useRealTimers();
});

describe('autosave', () => {
	it('writes once after typing stops, not once per keystroke', async () => {
		const id = openTab('/notes/a.md');
		for (const text of ['a', 'ab', 'abc']) {
			edit(id, text);
			scheduleAutosave(id);
			vi.advanceTimersByTime(200);
		}
		expect(writeDraft).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(800);
		expect(writeDraft).toHaveBeenCalledTimes(1);
		expect(get(autosaveStatus).state).toBe('saved');
	});

	it('writes during an unbroken typing burst rather than waiting for a pause', async () => {
		const id = openTab('/notes/a.md');
		// A keystroke every 300 ms never lets the 800 ms idle timer fire; the
		// ceiling is what stops the draft sitting in memory indefinitely.
		for (let i = 0; i < 20; i += 1) {
			edit(id, 'x'.repeat(i + 1));
			scheduleAutosave(id);
			await vi.advanceTimersByTimeAsync(300);
		}
		expect(writeDraft).toHaveBeenCalled();
	});

	it('never writes a document that has no location', async () => {
		const id = openTab('new://1', '');
		edit(id, 'a new document');
		scheduleAutosave(id);
		await vi.advanceTimersByTimeAsync(5000);
		expect(writeDraft).not.toHaveBeenCalled();
	});

	it('never writes a pasted or fetched document', async () => {
		for (const path of ['paste://1', 'url://https://example.com/x.md']) {
			writeDraft.mockClear();
			const id = openTab(path);
			edit(id, 'edited');
			scheduleAutosave(id);
			await vi.advanceTimersByTimeAsync(5000);
			expect(writeDraft, path).not.toHaveBeenCalled();
		}
	});

	it('does not write a file that changed underneath the edit', async () => {
		const id = openTab('/notes/a.md');
		edit(id, 'mine');
		tabStore.markConflict('/notes/a.md', 'theirs');
		scheduleAutosave(id);
		await vi.advanceTimersByTimeAsync(5000);
		// Writing here would destroy whatever the other writer put on disk.
		expect(writeDraft).not.toHaveBeenCalled();
	});

	it('resumes once the conflict is resolved', async () => {
		const id = openTab('/notes/a.md');
		edit(id, 'mine');
		tabStore.markConflict('/notes/a.md', 'theirs');
		scheduleAutosave(id);
		await vi.advanceTimersByTimeAsync(5000);
		expect(writeDraft).not.toHaveBeenCalled();

		tabStore.clearConflict(id);
		edit(id, 'mine, still');
		scheduleAutosave(id);
		await vi.advanceTimersByTimeAsync(1000);
		expect(writeDraft).toHaveBeenCalledTimes(1);
	});

	it('does nothing when the setting is off', async () => {
		settings.update((s) => ({ ...s, autosave: false }));
		const id = openTab('/notes/a.md');
		edit(id, 'edited');
		scheduleAutosave(id);
		await vi.advanceTimersByTimeAsync(5000);
		expect(writeDraft).not.toHaveBeenCalled();
	});

	it('reports a failed write and leaves the document dirty', async () => {
		writeDraft.mockRejectedValue(new Error('Read-only file system'));
		const id = openTab('/notes/a.md');
		edit(id, 'edited');
		scheduleAutosave(id);
		await vi.advanceTimersByTimeAsync(1000);

		const status = get(autosaveStatus);
		expect(status.state).toBe('error');
		expect(status.error).toContain('Read-only');
		// The draft is still only in memory; saying otherwise would invite the
		// user to close the tab and lose it.
		expect(get(tabStore.tabs).find((t) => t.id === id)?.dirty).toBe(true);
	});

	it('flushes a pending write without waiting for the debounce', async () => {
		const id = openTab('/notes/a.md');
		edit(id, 'edited');
		scheduleAutosave(id);
		expect(writeDraft).not.toHaveBeenCalled();

		await flushAutosave();
		expect(writeDraft).toHaveBeenCalledTimes(1);
	});

	it('cancels a pending write', async () => {
		const id = openTab('/notes/a.md');
		edit(id, 'edited');
		scheduleAutosave(id);
		cancelAutosave(id);
		await vi.advanceTimersByTimeAsync(5000);
		expect(writeDraft).not.toHaveBeenCalled();
	});

	it('does not write a draft that was already saved while it waited', async () => {
		const id = openTab('/notes/a.md');
		edit(id, 'edited');
		scheduleAutosave(id);
		// Cmd+S landed first.
		tabStore.markSaved(id);
		await vi.advanceTimersByTimeAsync(5000);
		expect(writeDraft).not.toHaveBeenCalled();
	});
});
