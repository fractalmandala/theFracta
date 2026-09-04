// Wiki entry types — generative, can grow as chats surface new categories.
// Each type seeds a different shape of entry + a different prompt for
// the strategy generator.

export type WikiEntryType =
	| 'pattern'      // reusable UI/architecture pattern (e.g. "page-split shell canon")
	| 'decision'     // a decision with rationale (e.g. "sharp corners + faint borders")
	| 'concept'      // a named concept that recurs (e.g. ".box / .row / .grid-*")
	| 'system'       // reference for a styling/design system (e.g. "fractalstyler2 contract")
	| 'broken'       // something that broke and how it broke (e.g. "svelte template literal gotchas")
	| 'recipe';      // step-by-step procedure (e.g. "strip-and-rebuild pattern")

export type WikiEntryStatus = 'proposed' | 'draft' | 'stable' | 'stale';

export interface WikiEntry {
	id: string;
	title: string;
	type: WikiEntryType;
	status: WikiEntryStatus;
	summary: string;          // one-line description
	body: string;             // full markdown content
	chatRefs: string[];       // session ids that contributed
	files: string[];          // project files this entry references
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export interface WikiRegistry {
	version: string;
	generatedBy: string;
	entries: WikiEntry[];
}
