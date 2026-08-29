<script lang="ts">
	import { observatory } from '$lib/observatory-state/observatory.svelte';
	let skills = $derived(observatory.topSkills);
	let tools = $derived(observatory.toolUsage);
</script>
<section class="trends"><header><p class="eyebrow">Canonical trends</p><h2>Skills and tools</h2><p class="muted">Counts and shares are returned by Fractorches for the active filter.</p></header><h3>Skills</h3><table><thead><tr><th>Skill</th><th>Calls</th><th>Sessions</th><th>Share</th><th>Last used</th></tr></thead><tbody>{#each skills as row}<tr><td>{row.skill_name}</td><td>{row.call_count}</td><td>{row.session_count}</td><td>{(row.pct * 100).toFixed(1)}%</td><td>{row.last_used_at}</td></tr>{:else}<tr><td colspan="5">No skills reported.</td></tr>{/each}</tbody></table><h3>Tools</h3><table><thead><tr><th>Tool</th><th>Category</th><th>Calls</th><th>Sessions</th><th>Share</th></tr></thead><tbody>{#each tools as row}<tr><td>{row.tool_name}</td><td>{row.category}</td><td>{row.call_count}</td><td>{row.session_count}</td><td>{(row.pct * 100).toFixed(1)}%</td></tr>{:else}<tr><td colspan="5">No tools reported.</td></tr>{/each}</tbody></table></section>
