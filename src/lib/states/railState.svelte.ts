// Which sidebar each side of the app is currently showing, and whether it is
// collapsed.
//
// The collapse controls live in the title bar, which is global, while the rails
// themselves belong to whichever surface is open — Notes has a library and a
// table of contents, Wiki has nav and an inspector, the Observatory has the
// session list and the filter panel. A rail announces itself here when it
// mounts, so one pair of header buttons can drive whatever is on screen.
//
// Collapsed state lives here rather than inside Rail for the same reason: the
// header has to be able to read it to show the right pressed state.

export type RailSide = 'left' | 'right';

type Registration = { id: string; label: string; defaultCollapsed?: boolean };

const STORAGE_PREFIX = 'fracta.rail.';

/** Read the persisted record for a rail. Storage can be unavailable. */
export function readRail(id: string): { width?: number; collapsed?: boolean } {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_PREFIX + id) || '{}');
	} catch {
		return {};
	}
}

/** Merge into the persisted record, so width and collapsed do not clobber. */
export function writeRail(id: string, patch: { width?: number; collapsed?: boolean }): void {
	try {
		localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify({ ...readRail(id), ...patch }));
	} catch {
		/* storage unavailable — the choice stays session-local */
	}
}

class RailState {
	private mounted = $state<Record<RailSide, Registration | null>>({ left: null, right: null });
	private collapsedById = $state<Record<string, boolean>>({});

	/**
	 * A rail claims its side while mounted. Returns the release function; the
	 * guard on release matters because surfaces swap in and out, and the
	 * outgoing rail's cleanup can run after the incoming one has registered.
	 */
	register(side: RailSide, entry: Registration): () => void {
		this.mounted[side] = entry;
		if (this.collapsedById[entry.id] === undefined) {
			// A stored choice always wins; defaultCollapsed only decides what a
			// rail does the very first time it is seen. The Observatory's filter
			// panel starts closed because its dashboards want the width.
			this.collapsedById[entry.id] = readRail(entry.id).collapsed ?? entry.defaultCollapsed ?? false;
		}
		return () => {
			if (this.mounted[side]?.id === entry.id) this.mounted[side] = null;
		};
	}

	has(side: RailSide): boolean {
		return this.mounted[side] !== null;
	}

	labelFor(side: RailSide): string {
		return this.mounted[side]?.label ?? '';
	}

	isCollapsed(id: string): boolean {
		return this.collapsedById[id] ?? false;
	}

	collapsedOn(side: RailSide): boolean {
		const entry = this.mounted[side];
		return entry ? this.isCollapsed(entry.id) : false;
	}

	setCollapsed(id: string, value: boolean): void {
		this.collapsedById[id] = value;
		writeRail(id, { collapsed: value });
	}

	toggle(side: RailSide): void {
		const entry = this.mounted[side];
		if (!entry) return;
		this.setCollapsed(entry.id, !this.isCollapsed(entry.id));
	}
}

export const railState = new RailState();
