import { describe, expect, it } from 'vitest';
import { resolveExternalChange } from '../../src/lib/stores/tabs';

/**
 * This decides whether a change on disk is taken up, ignored, or held as a
 * conflict — and it is the only thing standing between autosave and
 * overwriting a file another program just wrote. Each branch is stated here as
 * the case it protects against.
 */

const tab = (content: string, editContent: string | null = null) => ({
	content,
	editContent,
	dirty: editContent !== null && editContent !== content
});

describe('resolveExternalChange', () => {
	it('ignores our own write coming back as a change event', () => {
		// Autosave wrote "b"; markSaved set content to "b"; the OS then reports
		// the file changed. Reloading here would be pointless work, and with a
		// timing-based check it was the case that produced spurious reloads.
		expect(resolveExternalChange(tab('b'), 'b')).toBe('ignore');
	});

	it('ignores a touch that changed nothing', () => {
		expect(resolveExternalChange(tab('same', 'same'), 'same')).toBe('ignore');
	});

	it('adopts an external edit when there is nothing unsaved to lose', () => {
		expect(resolveExternalChange(tab('old'), 'new from git')).toBe('adopt');
	});

	it('adopts when the file now holds exactly what was being drafted', () => {
		// Another window saved the same text. There is no disagreement, so the
		// draft simply stops being unsaved rather than becoming a conflict.
		expect(resolveExternalChange(tab('old', 'mine'), 'mine')).toBe('adopt');
	});

	it('conflicts when an unsaved draft disagrees with what landed on disk', () => {
		// The case autosave must never resolve on its own: writing here would
		// destroy whatever the other writer put there.
		expect(resolveExternalChange(tab('old', 'mine'), 'theirs')).toBe('conflict');
	});

	it('treats a draft equal to the saved content as not dirty', () => {
		// The user typed and undid; there is nothing of theirs to protect.
		expect(resolveExternalChange(tab('old', 'old'), 'theirs')).toBe('adopt');
	});

	it('does not confuse an empty draft with no draft', () => {
		// Selecting all and deleting is a real edit worth protecting.
		expect(resolveExternalChange(tab('old', ''), 'theirs')).toBe('conflict');
	});
});
