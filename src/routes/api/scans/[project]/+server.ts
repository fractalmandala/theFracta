import { json } from '@sveltejs/kit';
import { readScan } from '$lib/observatory-server/local-data';
export function GET({ params, url }: { params: { project: string }; url: URL }) { try { return json(readScan(params.project, url.searchParams.get('type') || 'layout')); } catch (error) { return json({ error: error instanceof Error ? error.message : 'Scan unavailable' }, { status: 400 }); } }
