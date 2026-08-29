# Observatory upstream boundary

This app imports the runtime RepoGraph viewer from the local upstream source
at import time. The source tree was unchanged at the time of import. The
deterministic SHA-256 manifest of included upstream files is:

`f4974468125e5c4698a63ce05f180af10e4ff69864d26f5e7cebb43c2bc3c366`

The import includes the SvelteKit/Tauri graph and daily-log runtime. It
excludes Git and tool metadata, dependency/build output, local live/generated
data, private paths, screenshots/reference-only bulk assets, and the former
observatory snapshot/extractor pipeline. No upstream license file was present
in the source tree to copy.

The source repair history retained here includes real turn counting, global
deduplication, Codex subagent and Qoder coverage, and Peak Day / Active Days
rendering.

Session and metric data in this app is read from Fractorches HTTP APIs. The
graph domain remains user-selected local scan JSON and the daily-log domain
remains indexed local JSON. They are separate from session filtering. The
former durable-recall corpus UI is omitted because the available service
routes expose generated insights, not the corpus entry contract required by
that view. Recent-edits and pins are likewise omitted from navigation because
their service routes cannot accept the complete Observatory date/agent filter.
