# Fracta v0 Product Specification

Fracta is an integrated AI work surface, data bench, notes app, and more, and is a WIP. It has multiple app surfaces, the active and current ones are detailed in the forthcoming sections. 

## Features
- a markdown notes surface with folder tree, pinned folders, rich text + raw md views and more.
- a bench surface that provides several dashboards and data on agents usage, chat sessions, etc. with consolidated data and histories from multiple apps and providers.
- a wiki surface that builds an LLM wiki from the bench data
- an agents surface that hosts local agent chats against a chosen project folder, starting with the Gemini CLI, with explicit user approval for command and file-modifying actions
- all under 1 app surface.

## Notes Surface 

The notes surface is a real local Markdown workspace with persistent library. Provides:
- new note
- open, paste
- url entry
- pin one or more local folders, pinned folders survive restart
- add a notes folder as a **vault**: it is indexed locally, browses as a folder
      tree with true counts at any size, and is the basis for search across every
      note and for links between them. The vault itself is only ever read.
- shows recently opened local notes in newest-first order
- can work in multiple documents at once
- open documents retain their own unsaved state and reading position, can be switched without
      losing edits, and require an explicit discard decision before a dirty tab
      closes.
- unsaved new document chooses its file location on first save.
- any note is read, edited as rich text, or edited as raw markdown. Raw shows the
      source read-only for a pasted or fetched document, which has no file to save to.
- Switching modes keeps the user's document position as closely as the document structure allows;

The workspace supports file open, file association, drag and drop, paste, URL input, save, Save As for new notes, and local Markdown links. It distinguishes cancellation, invalid input, unavailable files, and save or fetch failures from a genuine empty document.

## Bench Surface

Bench is also called Observatory. It reports its actual sync state and last successful refresh. It never labels a static snapshot as live. Values presented as totals, usage, cost, savings, quality, velocity, outcomes, or activity come from real canonical data and documented calculations. Estimated or unavailable values are labeled as such or omitted.

Every data surface has distinct loading, populated, true-empty, stale, unavailable, and error behavior as applicable. A parse or transport error is not shown as an empty dataset.

A visible full-text, semantic, or hybrid search mode executes the corresponding Fractorches search and opens real matching sessions or messages. Unimplemented modes are absent. Opening a session shows its canonical transcript, tool events, usage context, and source-supported metadata rather than an empty or provider-limited transcript.

## Agents Surface

The agents surface hosts local agent chats inside Fracta. The first slice
supports the Gemini CLI as its agent. The user picks a project folder, chats
with the agent working in that folder, explicitly approves command runs and
file modifications, and every chat is recorded by the same archive the bench
reports on.

### Behavior

1. Agents is the fourth entry in the surface switcher next to Notes, Bench, and
   Wiki, selected by click and by the same keyboard pattern (Cmd+4).

2. A session is started by choosing a local project folder through the native
   folder picker and opening a new chat for it. The session list groups sessions
   under their projects, newest first, labeled by project and start time. It
   never invents titles.

3. A starting session shows a truthful starting state. The composer is disabled
   until the agent is actually ready to receive prompts. If the agent cannot
   start — CLI not installed, binary fails to launch, project folder unreadable
   — the session shows the real error and never renders as an empty chat.

4. Sending a prompt starts a turn. Assistant text streams into the chat as it
   arrives. While the agent is working, the composer is disabled and a Stop
   control is available. Stopping cancels the current turn, marks the transcript
   at its stopping point, and leaves the session usable for the next prompt.

5. Tool activity appears as cards: a human-readable tool name, a one-line
   description, and a live status, collapsed by default. A card can be expanded
   to show the detail the agent reported. Finished cards show their outcome
   (completed or failed).

6. The agent never runs commands or modifies files in the project without an
   explicit user approval in this surface. When the agent requests permission,
   an approval card shows the concrete action with enough context to decide on;
   the turn waits until the user approves or denies. Denial is delivered to the
   agent as a normal rejection and the turn continues. An unanswered card waits
   indefinitely; Stop remains available throughout.

7. Up to three sessions run concurrently, across any mix of projects, and
   multiple sessions on the same project are allowed. Starting a fourth reports
   the limit truthfully (stop a session first); nothing is queued invisibly.

8. Sessions keep running while the user is on other surfaces. Switching away
   never stops or pauses them; returning shows the transcript caught up.

9. Closing a session ends it. A closed session remains resumable from its
   project's session list; a resumed session shows the conversation the agent
   restores, then continues. A session interrupted by an app exit is resumable
   the same way.

10. Quitting Fracta stops the agent processes the app owns. While sessions are
    active, Fracta warns before quitting.

11. Agent-side errors — rate limits, quota, model failures, crashes — appear as
    distinct error entries showing the agent's message verbatim, never dressed
    up as assistant text. A crashed session shows a failed state with its resume
    path.

12. Every session conducted here is recorded by the canonical archive and
    appears in the Bench with its real provider identity, messages, and usage.
    The agents surface itself shows no token, cost, or usage numbers in this
    slice; the Bench is the place for those.

13. The surface shows only real activity. A new chat is a true empty state; no
    placeholder messages, synthetic status text, or fabricated metrics exist.
    The composer is enabled only when the session can actually receive prompts.

14. The composer, session list, tool and approval cards, Stop, and the
    approve/deny controls are reachable and operable by keyboard, carry
    accessible names, and keep focus handling sensible while content streams.

15. If a project folder is moved, removed, or becomes unreadable mid-session,
    agent-side failures surface verbatim per (11); closing the session is always
    available.

### Non-goals for the first slice

- Git worktrees; sessions run directly in the chosen project folder.
- Background or scheduled agents; sessions live inside the running app.
- A second agent adapter (Antigravity comes later).
- Diff review views, usage metrics, and wiki/notes context tools for agents.

## Current Work Streams (ongoing)
- styling standardization with fractalstyler2
- wiki surface development
- agents surface: first slice (Gemini CLI chats)