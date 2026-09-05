package server_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go.kenn.io/agentsview/internal/config"
	"go.kenn.io/agentsview/internal/db"
	"go.kenn.io/agentsview/internal/insight"
	"go.kenn.io/agentsview/internal/server"
)

type wikiCompileStatusResult struct {
	Available          bool     `json:"available"`
	Reason             string   `json:"reason"`
	EndpointConfigured bool     `json:"endpoint_configured"`
	Agents             []string `json:"agents"`
}

type wikiCompileProvenanceEntry struct {
	ID              string `json:"id"`
	Title           string `json:"title"`
	Type            string `json:"type"`
	ReviewState     string `json:"review_state"`
	ProvenanceOK    bool   `json:"provenance_ok"`
	Project         string `json:"project"`
	Agent           string `json:"agent"`
	SourceSessionID string `json:"source_session_id"`
	UpdatedAt       string `json:"updated_at"`
}

type wikiCompileResponse struct {
	Markdown    string `json:"markdown"`
	Topic       string `json:"topic"`
	GeneratedBy struct {
		Agent string `json:"agent"`
		Model string `json:"model"`
	} `json:"generated_by"`
	Entries    []wikiCompileProvenanceEntry `json:"entries"`
	CompiledAt string                       `json:"compiled_at"`
}

func seedWikiCompileEntries(t *testing.T, te *testEnv) {
	t.Helper()
	seedRecallEntrySession(t, te)
	seedRecallEntry(t, te, db.RecallEntry{
		ID:              "compile-a",
		Title:           "Portal filter labels",
		Body:            "The portal filter menu drops labels under 640px.",
		ReviewState:     "human_reviewed",
		Project:         "agentsview",
		Agent:           "codex",
		SourceSessionID: "recall-session",
	})
	seedRecallEntry(t, te, db.RecallEntry{
		ID:              "compile-b",
		Title:           "Cwd retry pattern",
		Body:            "Retrying file reads after fixing the cwd succeeded.",
		SourceSessionID: "recall-session",
	})
}

func TestWikiCompileStatus_EndpointConfigured(t *testing.T) {
	te := setupWithServerOpts(t, nil, func(c *config.Config) {
		c.Insights.Endpoint = "http://127.0.0.1:1"
		c.Insights.Model = "test-model"
	})

	w := te.get(t, "/api/v1/wiki/compile/status")

	assertStatus(t, w, http.StatusOK)
	var status wikiCompileStatusResult
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &status))
	assert.True(t, status.Available)
	assert.True(t, status.EndpointConfigured)
}

func TestWikiCompileStatus_UnconfiguredStatesItsReason(t *testing.T) {
	te := setup(t)

	w := te.get(t, "/api/v1/wiki/compile/status")

	assertStatus(t, w, http.StatusOK)
	var status wikiCompileStatusResult
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &status))
	assert.False(t, status.EndpointConfigured)
	if !status.Available {
		assert.NotEmpty(t, status.Reason,
			"an unavailable compile status must say why")
	}
}

func TestWikiCompile_CompilesSelectedEntries(t *testing.T) {
	var capturedAgent, capturedPrompt string
	stubGen := func(
		_ context.Context, agent, prompt string, _ insight.LogFunc,
	) (insight.Result, error) {
		capturedAgent = agent
		capturedPrompt = prompt
		return insight.Result{
			Agent:   "claude",
			Model:   "test-model",
			Content: "# Portal filters\n\nLabels drop below 640px [recall:compile-a].",
		}, nil
	}
	te := setupWithServerOpts(t, []server.Option{
		server.WithGenerateStreamFunc(stubGen),
	})
	seedWikiCompileEntries(t, te)

	w := te.post(t, "/api/v1/wiki/compile",
		`{"entry_ids":["compile-a","compile-b"],"topic":"portal filter behavior"}`)
	assertStatus(t, w, http.StatusOK)

	var response wikiCompileResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &response))
	assert.Equal(t, "claude", capturedAgent)
	assert.Equal(t,
		"# Portal filters\n\nLabels drop below 640px [recall:compile-a].",
		response.Markdown)
	assert.Equal(t, "portal filter behavior", response.Topic)
	assert.Equal(t, "claude", response.GeneratedBy.Agent)
	assert.Equal(t, "test-model", response.GeneratedBy.Model)
	assert.NotEmpty(t, response.CompiledAt)
	require.Len(t, response.Entries, 2)
	assert.Equal(t, "compile-a", response.Entries[0].ID)
	assert.Equal(t, "Portal filter labels", response.Entries[0].Title)
	assert.Equal(t, "human_reviewed", response.Entries[0].ReviewState)
	assert.Equal(t, "recall-session", response.Entries[0].SourceSessionID)
	assert.Equal(t, "agentsview", response.Entries[0].Project)
	assert.Equal(t, "compile-b", response.Entries[1].ID)

	for _, want := range []string{
		"[recall:compile-a] Portal filter labels",
		"The portal filter menu drops labels under 640px.",
		"[recall:compile-b] Cwd retry pattern",
		"Retrying file reads after fixing the cwd succeeded.",
		"provenance: unverified",
		"portal filter behavior",
		"[recall:<id>]",
	} {
		assert.Contains(t, capturedPrompt, want, "prompt: %s", capturedPrompt)
	}
}

func TestWikiCompile_RejectsUnknownEntry(t *testing.T) {
	te := setupWithServerOpts(t, []server.Option{
		server.WithGenerateStreamFunc(func(
			_ context.Context, _, _ string, _ insight.LogFunc,
		) (insight.Result, error) {
			return insight.Result{Content: "should not run"}, nil
		}),
	})
	seedWikiCompileEntries(t, te)

	w := te.post(t, "/api/v1/wiki/compile",
		`{"entry_ids":["compile-a","missing-id"]}`)
	assertStatus(t, w, http.StatusNotFound)
	assertBodyContains(t, w, "missing-id")
}

func TestWikiCompile_RejectsArchivedEntry(t *testing.T) {
	te := setupWithServerOpts(t, []server.Option{
		server.WithGenerateStreamFunc(func(
			_ context.Context, _, _ string, _ insight.LogFunc,
		) (insight.Result, error) {
			return insight.Result{Content: "should not run"}, nil
		}),
	})
	seedWikiCompileEntries(t, te)
	seedRecallEntry(t, te, db.RecallEntry{
		ID:              "compile-dead",
		Title:           "Archived finding",
		Body:            "This finding was archived.",
		Status:          "archived",
		SourceSessionID: "recall-session",
	})

	w := te.post(t, "/api/v1/wiki/compile",
		`{"entry_ids":["compile-dead"]}`)
	assertStatus(t, w, http.StatusUnprocessableEntity)
	assertBodyContains(t, w, "compile-dead")
}

func TestWikiCompile_RejectsEmptyEntryIDs(t *testing.T) {
	te := setup(t)

	w := te.post(t, "/api/v1/wiki/compile", `{"entry_ids":[]}`)
	assertStatus(t, w, http.StatusBadRequest)
	assertBodyContains(t, w, "at least one")
}

func TestWikiCompile_RejectsTooManyEntryIDs(t *testing.T) {
	te := setup(t)
	ids := make([]string, 0, 51)
	for i := range 51 {
		ids = append(ids, fmt.Sprintf("entry-%02d", i))
	}
	payload := fmt.Sprintf(`{"entry_ids":[%s]}`, joinQuoted(t, ids))

	w := te.post(t, "/api/v1/wiki/compile", payload)
	assertStatus(t, w, http.StatusBadRequest)
	assertBodyContains(t, w, "at most 50")
}

func TestWikiCompile_RejectsInvalidAgent(t *testing.T) {
	te := setup(t)

	w := te.post(t, "/api/v1/wiki/compile",
		`{"entry_ids":["compile-a"],"agent":"not-an-agent"}`)
	assertStatus(t, w, http.StatusBadRequest)
	assertBodyContains(t, w, "invalid agent")
}

func TestWikiCompile_GenerationFailureSurfacesClientMessage(t *testing.T) {
	stubGen := func(
		_ context.Context, _, _ string, _ insight.LogFunc,
	) (insight.Result, error) {
		return insight.Result{}, fmt.Errorf(
			"claude returned empty result\nstderr: raw {\"type\":\"result\"}",
		)
	}
	te := setupWithServerOpts(t, []server.Option{
		server.WithGenerateStreamFunc(stubGen),
	})
	seedWikiCompileEntries(t, te)

	w := te.post(t, "/api/v1/wiki/compile", `{"entry_ids":["compile-a"]}`)
	assertStatus(t, w, http.StatusBadGateway)
	assertBodyContains(t, w, "claude returned empty result")
	assert.NotContains(t, w.Body.String(), `"type":"result"`,
		"raw payload must be stripped from the client message")
}

func joinQuoted(t *testing.T, ids []string) string {
	t.Helper()
	out := ""
	for i, id := range ids {
		if i > 0 {
			out += ","
		}
		out += fmt.Sprintf("%q", id)
	}
	return out
}
