import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type Registry = { projects: Array<{ name: string; slug: string; tagline?: string; path: string; scansAvailable: string[]; lastScannedDate?: string }> };
export type ScanType = 'layout' | 'system' | 'boundary' | 'health';
export type ScanPayload = { version: number; scan: ScanType; project: { name: string; slug: string; date: string }; [key: string]: unknown };
export type LogIndex = { days: Array<{ date: string; file: string; [key: string]: unknown }>; [key: string]: unknown };
export type LogEntry = { date: string; [key: string]: unknown };
const scanTypes = new Set<ScanType>(['layout', 'system', 'boundary', 'health']);
export function configuredRoot(kind: 'scans' | 'logs') { const value = kind === 'scans' ? process.env.FRACTA_REPOGRAPH_ROOT : process.env.FRACTA_DAILY_LOG_ROOT; return path.resolve(value || path.join(os.homedir(), '.repograph', kind)); }
function safeChild(root: string, child: string) { if (!child || child.includes('\0')) throw new Error('invalid path'); const base = fs.realpathSync(root); const target = fs.realpathSync(path.resolve(base, child)); const relative = path.relative(base, target); if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('path escapes configured root'); return target; }
function json<T>(file: string): T { return JSON.parse(fs.readFileSync(file, 'utf8')) as T; }
function date(value: unknown): value is string { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value); }
export function readRegistry(): Registry { const data = json<Registry>(safeChild(configuredRoot('scans'), 'registry.json')); if (!Array.isArray(data.projects) || data.projects.some((project) => typeof project.slug !== 'string' || !Array.isArray(project.scansAvailable))) throw new Error('invalid project registry'); return data; }
export function readScan(project: string, scanType: string): ScanPayload { if (!/^[a-z0-9][a-z0-9-]*$/.test(project) || !scanTypes.has(scanType as ScanType)) throw new Error('invalid project or scan type'); const entry = readRegistry().projects.find((item) => item.slug === project); if (!entry) throw new Error('project is not present in registry'); if (!entry.scansAvailable.includes(scanType)) throw new Error('scan type is unavailable'); const data = json<ScanPayload>(safeChild(configuredRoot('scans'), `${project}/${scanType}.json`)); if (data.scan !== scanType || !date(data.project?.date)) throw new Error('invalid scan payload'); return data; }
export function readLogIndex(): LogIndex { const data = json<LogIndex>(safeChild(configuredRoot('logs'), 'index.json')); if (!Array.isArray(data.days) || data.days.some((day) => !date(day.date) || !/^[^/\\]+\.json$/.test(day.file))) throw new Error('invalid daily-log index'); return data; }
export function readLog(value: string): LogEntry { if (!date(value)) throw new Error('invalid date'); const entry = readLogIndex().days.find((day) => day.date === value); if (!entry) throw new Error('daily log is unavailable'); const data = json<LogEntry>(safeChild(configuredRoot('logs'), entry.file)); if (data.date !== value) throw new Error('daily log date does not match index'); return data; }
