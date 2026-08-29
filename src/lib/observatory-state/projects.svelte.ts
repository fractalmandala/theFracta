// Projects and Scans State Module
import { ipcGetProjects, ipcGetScan, type ScanPayload } from '$lib/observatory-ipc';

export interface ProjectEntry {
	name: string;
	slug: string;
	tagline?: string;
	path: string;
	scansAvailable: string[];
	lastScannedDate?: string;
}

class ProjectsState {
	projects = $state<ProjectEntry[]>([]);
	activeProjectSlug = $state<string>('');
	activeScanType = $state<'layout' | 'system' | 'boundary' | 'health'>('layout');
	activeScan = $state<ScanPayload | null>(null);
	isLoading = $state(false);
	error = $state<string | null>(null);

	activeProject = $derived(
		this.projects.find((p) => p.slug === this.activeProjectSlug) ?? this.projects[0] ?? null
	);

	async fetchProjects() {
		this.isLoading = true;
		this.error = null;
		try {
			const data = await ipcGetProjects();
			this.projects = data.projects ?? [];
			if (!this.activeProjectSlug && this.projects.length > 0) {
				this.activeProjectSlug = this.projects[0].slug;
			}
		} catch (e: any) {
			this.error = e.message;
		} finally {
			this.isLoading = false;
		}
	}

	async loadScan(projectSlug: string, scanType: 'layout' | 'system' | 'boundary' | 'health' = 'layout') {
		this.activeProjectSlug = projectSlug;
		this.activeScanType = scanType;
		this.isLoading = true;
		this.error = null;
		try {
			this.activeScan = await ipcGetScan(projectSlug, scanType);
		} catch (e: any) {
			this.activeScan = null;
			this.error = e.message;
		} finally {
			this.isLoading = false;
		}
	}
}

export const projectsState = new ProjectsState();
