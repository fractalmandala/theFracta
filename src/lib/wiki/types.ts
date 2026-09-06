// Wiki entry types — generative, can grow as chats surface new categories.
// Each type seeds a different shape of entry + a different prompt for
// the strategy generator.

export type WikiEntryType =
	| 'pattern'      // reusable UI/architecture pattern (e.g. "page-split shell canon")
	| 'decision'     // a decision with rationale (e.g. "sharp corners + faint borders")
	| 'concept'      // a named concept that recurs (e.g. ".box / .row / .grid-*")
	| 'system'       // reference for a styling/design system (e.g. "fractalstyler2 contract")
	| 'broken'       // something that broke and how it broke (e.g. "svelte template literal gotchas")
	| 'recipe'       // step-by-step procedure (e.g. "strip-and-rebuild pattern")
	| 'Pattern'
	| 'Decision'
	| 'Concept'
	| 'System'
	| 'Case History'
	| 'Convention'
	| 'Project'
	| 'Glossary Term'
	| (string & {});

export type WikiEntryStatus = 'proposed' | 'draft' | 'stable' | 'stale';

export interface WikiSourceRef {
	id?: string;
	title?: string;
	reference?: string;
	timestamp?: string;
}

export interface WikiEntry {
	id: string;
	title: string;
	type: WikiEntryType;
	status: WikiEntryStatus;
	section?: string;         // e.g. 'core-concepts', 'systems', 'decisions'
	sectionTitle?: string;    // e.g. 'Core Concepts', 'Systems'
	summary: string;          // one-line description
	description?: string;     // alias for summary
	body: string;             // full markdown content
	chatRefs: string[];       // session ids that contributed
	files: string[];          // project files this entry references
	tags: string[];
	sources?: WikiSourceRef[];
	generated?: {
		by?: string;
		at?: string;
	};
	createdAt: string;
	updatedAt: string;
	/** Recall entry ids whose cluster grounded a compiled draft. */
	compiledFrom?: string[];
	/** When the Fractorches compiler produced the draft (RFC3339). */
	compiledAt?: string;
	filePath?: string;
}

export interface WikiSectionGroup {
	key: string;
	title: string;
	count: number;
	entries: WikiEntry[];
}

