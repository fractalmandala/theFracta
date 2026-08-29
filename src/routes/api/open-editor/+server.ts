import { json } from '@sveltejs/kit';
import { exec } from 'node:child_process';
import path from 'node:path';

export async function POST({ request }) {
	try {
		const { file, line, projectPath } = await request.json();
		if (!file) return json({ error: 'file is required' }, { status: 400 });

		const fullPath = path.isAbsolute(file)
			? file
			: projectPath
				? path.join(projectPath, file)
				: file;

		const target = line ? `${fullPath}:${line}` : fullPath;

		// Try opening in cursor or vscode or default editor
		exec(`cursor -g "${target}" || code -g "${target}" || open "${fullPath}"`, (err) => {
			if (err) console.error('Failed to open file in editor:', err);
		});

		return json({ ok: true, opened: target });
	} catch (e: any) {
		return json({ error: e.message }, { status: 500 });
	}
}
