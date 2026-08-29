import { json } from '@sveltejs/kit';
import { readRegistry } from '$lib/observatory-server/local-data';
export function GET() { try { return json(readRegistry()); } catch (error) { return json({ error: error instanceof Error ? error.message : 'Project registry unavailable' }, { status: 503 }); } }
