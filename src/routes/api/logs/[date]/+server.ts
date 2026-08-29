import { json } from '@sveltejs/kit';
import { readLog } from '$lib/observatory-server/local-data';
export function GET({ params }: { params: { date: string } }) { try { return json(readLog(params.date)); } catch (error) { return json({ error: error instanceof Error ? error.message : 'Daily log unavailable' }, { status: 400 }); } }
