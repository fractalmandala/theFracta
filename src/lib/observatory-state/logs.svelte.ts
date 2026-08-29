// Daily Logs Explorer State Module
import { ipcGetDailyLogsIndex, ipcGetDailyLog } from '$lib/observatory-ipc';

export interface DaySummary {
	date: string;
	day_of_week: string;
	file: string;
	browsing_entries?: number;
	commits?: number;
	agent_sessions?: number;
	handoffs?: number;
}

export interface DailyLogIndex {
	date_range: { start: string; end: string };
	total_days: number;
	days: DaySummary[];
}

export interface LogDetail {
	date: string;
	summary?: string;
	browsing?: any[];
	commits?: any[];
	agent_sessions?: any[];
	handoffs?: any[];
	timeline?: any[];
	notes?: string[];
	[key: string]: any;
}

class LogsState {
	index = $state<DailyLogIndex | null>(null);
	activeDate = $state<string>('');
	activeLog = $state<LogDetail | null>(null);
	filterType = $state<'all' | 'commits' | 'sessions' | 'browsing' | 'handoffs'>('all');
	searchQuery = $state<string>('');
	selectedEntry = $state<any | null>(null);
	isLoading = $state(false);
	error = $state<string | null>(null);

	filteredDays = $derived.by(() => {
		if (!this.index?.days) return [];
		if (!this.searchQuery.trim()) return this.index.days;
		const q = this.searchQuery.toLowerCase();
		return this.index.days.filter(
			(d) => d.date.includes(q)
		);
	});

	async fetchIndex() {
		this.isLoading = true;
		this.error = null;
		try {
			const raw = await ipcGetDailyLogsIndex();
			this.index = {
				date_range: { start: raw.days[0]?.date ?? '', end: raw.days.at(-1)?.date ?? '' },
				total_days: raw.days.length,
				days: raw.days.map((day) => ({
					date: day.date,
					file: day.file,
					day_of_week: new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long' }),
					browsing_entries: typeof day.browsing_entries === 'number' ? day.browsing_entries : undefined,
					commits: typeof day.commits === 'number' ? day.commits : undefined,
					agent_sessions: typeof day.agent_sessions === 'number' ? day.agent_sessions : undefined,
					handoffs: typeof day.handoffs === 'number' ? day.handoffs : undefined
				}))
			};
			if (!this.activeDate && this.index?.days && this.index.days.length > 0) {
				const latest = this.index.days[this.index.days.length - 1].date;
				await this.loadDate(latest);
			}
		} catch (e: any) {
			this.error = e.message;
		} finally {
			this.isLoading = false;
		}
	}

	async loadDate(date: string) {
		this.activeDate = date;
		this.isLoading = true;
		this.error = null;
		try {
			this.activeLog = await ipcGetDailyLog(date);
		} catch (e: any) {
			this.activeLog = null;
			this.error = e.message;
		} finally {
			this.isLoading = false;
		}
	}

	setFilter(type: 'all' | 'commits' | 'sessions' | 'browsing' | 'handoffs') {
		this.filterType = type;
	}

	selectEntry(entry: any) {
		this.selectedEntry = entry;
	}

	closeModal() {
		this.selectedEntry = null;
	}
}

export const logsState = new LogsState();
