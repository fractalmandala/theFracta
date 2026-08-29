import { json } from '@sveltejs/kit';
import { readLogIndex } from '$lib/observatory-server/local-data';
export function GET() { try { return json(readLogIndex()); } catch (error) { return json({ error: error instanceof Error ? error.message : 'Daily log index unavailable' }, { status: 503 }); } }
