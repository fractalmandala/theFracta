package parser

import (
	"path/filepath"
	"testing"
)

// Gemini writes two shapes into chats/. One puts "sessionId" on its records;
// the other has only message records interleaved with "$set" metadata and
// carries the id in the filename. The second shape used to fail to parse, and
// because a parse failure counts as a sync failure — and one failure aborts the
// whole watch-root reconciliation — a single such file stalled every sync
// permanently. The file never goes away, so the sync never completed.
func TestGeminiJSONLWithoutSessionIDUsesFilename(t *testing.T) {
	p := &geminiProvider{}
	path := filepath.Join(
		"testdata", "gemini", "session-2026-06-11T18-52-2b7403a4.jsonl",
	)

	session, messages, err := p.parseSession(path, "fixture", "test-machine")
	if err != nil {
		t.Fatalf("parse failed, which would abort the sync: %v", err)
	}
	if session == nil {
		t.Fatal("expected a session")
	}
	if want := "gemini:2b7403a4"; session.ID != want {
		t.Errorf("session id = %q, want %q", session.ID, want)
	}
	// The "$set" lines are metadata, not messages, and must not be counted.
	if len(messages) != 2 {
		t.Errorf("messages = %d, want 2 (the $set lines are not messages)", len(messages))
	}
}

func TestGeminiSessionIDFromPath(t *testing.T) {
	cases := map[string]string{
		"/x/session-2026-06-11T18-52-2b7403a4.jsonl": "2b7403a4",
		"/x/session-.jsonl":                          "",
		"/x/notasession.jsonl":                       "",
		"/x/session.jsonl":                           "",
	}
	for in, want := range cases {
		if got := geminiSessionIDFromPath(in); got != want {
			t.Errorf("geminiSessionIDFromPath(%q) = %q, want %q", in, got, want)
		}
	}
}
