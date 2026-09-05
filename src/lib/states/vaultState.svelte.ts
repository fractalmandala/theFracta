// The notes vault, as the UI sees it.
//
// One place owns vault data, because three components used to fetch folder
// listings independently and cache them privately with no way to invalidate —
// so a folder went stale the moment anything on disk changed, and the same
// folder was scanned up to three times on one screen.

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export type VaultState_ = 'never' | 'discovering' | 'indexing' | 'ready' | 'stale' | 'error';

export type VaultSummary = {
	id: number;
	root: string;
	label: string;
	state: VaultState_;
	discovered_at: number | null;
	indexed_at: number | null;
	last_error: string | null;
	file_count: number;
	indexed_count: number;
};

export type DirEntry = {
	rel_path: string;
	name: string;
	file_count: number;
	subtree_count: number;
};

export type FileEntry = {
	id: number;
	rel_path: string;
	name: string;
	title: string | null;
	mtime_ms: number;
	size: number;
	indexed: boolean;
};

export type Children = {
	dirs: DirEntry[];
	files: FileEntry[];
	indexed_at: number | null;
	state: VaultState_;
};

export type ScanDone = {
	vault_id: number;
	files: number;
	dirs: number;
	missing: number;
	moved: number;
	duration_ms: number;
	cancelled: boolean;
	error: string | null;
};

const key = (vaultId: number, relPath: string) => `${vaultId}:${relPath}`;
const EXPANDED_KEY = 'fracta.vault.expanded';

class VaultStore {
	vaults = $state<VaultSummary[]>([]);
	/** Children by `vaultId:relPath`. The single cache. */
	children = $state<Record<string, Children>>({});
	expanded = $state<Record<string, boolean>>(readExpanded());
	/** Why the index is unusable, when it is. Notes still works without it. */
	unavailable = $state<string | null>(null);
	/** In-flight scans, so the tree can say it is still reading the folder. */
	scanning = $state<Record<number, boolean>>({});
	busy = $state(false);

	private listening = false;

	/** Load vaults and start listening. Safe to call from several components. */
	async init(): Promise<void> {
		if (!this.listening) {
			this.listening = true;
			void listen<{ vault_id: number }>('vault-scan-progress', (event) => {
				this.scanning[event.payload.vault_id] = true;
			});
			void listen<ScanDone>('vault-scan-done', (event) => {
				const { vault_id } = event.payload;
				delete this.scanning[vault_id];
				// The walk changed what is on disk as far as we know it, so every
				// cached listing for that vault is suspect. Dropping them all is
				// cheaper than reasoning about which parents moved.
				this.invalidate(vault_id);
				void this.refreshVaults();
			});
		}
		await this.refreshVaults();
	}

	async refreshVaults(): Promise<void> {
		try {
			await invoke<boolean>('vault_available');
			this.vaults = await invoke<VaultSummary[]>('vault_list');
			this.unavailable = null;
		} catch (error) {
			this.unavailable = describe(error);
			this.vaults = [];
		}
	}

	/** Children of a folder, from the index. Cached until something invalidates. */
	async loadChildren(vaultId: number, relPath: string, force = false): Promise<void> {
		const k = key(vaultId, relPath);
		if (!force && this.children[k]) return;
		try {
			this.children[k] = await invoke<Children>('vault_list_children', {
				vaultId,
				relPath
			});
		} catch (error) {
			this.unavailable = describe(error);
		}
	}

	childrenOf(vaultId: number, relPath: string): Children | undefined {
		return this.children[key(vaultId, relPath)];
	}

	isExpanded(vaultId: number, relPath: string): boolean {
		return this.expanded[key(vaultId, relPath)] ?? false;
	}

	async toggle(vaultId: number, relPath: string): Promise<void> {
		const k = key(vaultId, relPath);
		const next = !this.expanded[k];
		this.expanded[k] = next;
		writeExpanded(this.expanded);
		if (next) await this.loadChildren(vaultId, relPath);
	}

	/** Forget cached listings for a vault. */
	invalidate(vaultId: number): void {
		for (const k of Object.keys(this.children)) {
			if (k.startsWith(`${vaultId}:`)) delete this.children[k];
		}
	}

	async addVault(path: string): Promise<void> {
		this.busy = true;
		try {
			const id = await invoke<number>('vault_add', { path });
			this.expanded[key(id, '')] = true;
			writeExpanded(this.expanded);
			await this.refreshVaults();
		} finally {
			this.busy = false;
		}
	}

	/** Removes the index rows only. The folder and its notes are untouched. */
	async removeVault(vaultId: number): Promise<void> {
		await invoke('vault_remove', { vaultId });
		this.invalidate(vaultId);
		await this.refreshVaults();
	}

	async rescan(vaultId: number): Promise<void> {
		this.scanning[vaultId] = true;
		await invoke('vault_scan', { vaultId });
	}
}

/**
 * Turn a failure into something worth reading.
 *
 * A vault lives behind a Tauri command, so in a plain browser every call fails
 * on a missing bridge. Surfacing the raw "Cannot read properties of undefined"
 * tells the user nothing about what is wrong or whether it matters — and this
 * is a supported way to run the app during development, not a broken state.
 */
function describe(error: unknown): string {
	const message = error instanceof Error ? error.message : String(error);
	if (/__TAURI|invoke|undefined \(reading/i.test(message)) {
		return 'Vaults are indexed by the desktop app, so they are unavailable in browser mode.';
	}
	return message;
}

function readExpanded(): Record<string, boolean> {
	try {
		return JSON.parse(localStorage.getItem(EXPANDED_KEY) || '{}');
	} catch {
		return {};
	}
}

function writeExpanded(value: Record<string, boolean>): void {
	try {
		localStorage.setItem(EXPANDED_KEY, JSON.stringify(value));
	} catch {
		/* storage unavailable — the tree just forgets on next launch */
	}
}

export const vaultState = new VaultStore();
