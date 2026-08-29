package db

import (
	"context"
	"sort"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type filterFixture struct {
	id, project, agent, model, date string
	automated                       bool
	userMessages                    int
}

func boolPointer(value bool) *bool { return &value }

func seedCanonicalFilterSession(
	t *testing.T, database *DB, fixture filterFixture, content string,
) {
	t.Helper()
	start := fixture.date + "T10:00:00Z"
	end := fixture.date + "T11:00:00Z"
	insertSession(t, database, fixture.id, fixture.project, func(session *Session) {
		session.Agent = fixture.agent
		session.StartedAt = &start
		session.EndedAt = &end
		session.UserMessageCount = fixture.userMessages
		session.IsAutomated = fixture.automated
	})
	message := userMsgAt(fixture.id, 0, content, start)
	message.Model = fixture.model
	insertMessages(t, database, message)
}

func setCanonicalFilterSession(
	t *testing.T, database *DB, fixture filterFixture,
) {
	t.Helper()
	start := fixture.date + "T10:00:00Z"
	end := fixture.date + "T11:00:00Z"
	_, err := database.getWriter().Exec(`
		UPDATE sessions
		SET agent = ?, user_message_count = ?, is_automated = ?,
			started_at = ?, ended_at = ?
		WHERE id = ?`,
		fixture.agent, fixture.userMessages, fixture.automated,
		start, end, fixture.id,
	)
	require.NoError(t, err)
	_, err = database.getWriter().Exec(
		"UPDATE messages SET model = ? WHERE session_id = ?",
		fixture.model, fixture.id,
	)
	require.NoError(t, err)
}

func sortedSearchSessionIDs(results []SearchResult) []string {
	ids := make([]string, 0, len(results))
	for _, result := range results {
		ids = append(ids, result.SessionID)
	}
	sort.Strings(ids)
	return ids
}

func sortedRecentSessionIDs(result RecentEditsResult) []string {
	ids := make([]string, 0, len(result.Files))
	for _, file := range result.Files {
		ids = append(ids, file.LastSessionID)
	}
	sort.Strings(ids)
	return ids
}

func sortedPinnedSessionIDs(pins []PinnedMessage) []string {
	ids := make([]string, 0, len(pins))
	for _, pin := range pins {
		ids = append(ids, pin.SessionID)
	}
	sort.Strings(ids)
	return ids
}

func sortedRecallIDs(entries []RecallEntry) []string {
	ids := make([]string, 0, len(entries))
	for _, entry := range entries {
		ids = append(ids, entry.ID)
	}
	sort.Strings(ids)
	return ids
}

func TestSearchCanonicalSessionFilters(t *testing.T) {
	database := testDB(t)
	requireFTS(t, database)
	fixtures := []filterFixture{
		{id: "human-alpha", project: "alpha", agent: "claude", model: "model-a", date: "2026-06-01", userMessages: 2},
		{id: "auto-beta", project: "beta", agent: "codex", model: "model-b", date: "2026-06-02", automated: true, userMessages: 2},
		{id: "one-shot", project: "alpha", agent: "claude", model: "model-c", date: "2026-06-03", userMessages: 1},
	}
	for _, fixture := range fixtures {
		seedCanonicalFilterSession(t, database, fixture, "canonical parity term")
	}

	tests := []struct {
		name   string
		filter SearchFilter
		want   []string
	}{
		{name: "default includes every class", filter: SearchFilter{}, want: []string{"auto-beta", "human-alpha", "one-shot"}},
		{name: "project", filter: SearchFilter{Project: "beta"}, want: []string{"auto-beta"}},
		{name: "agent", filter: SearchFilter{Agent: "codex"}, want: []string{"auto-beta"}},
		{name: "model", filter: SearchFilter{Model: "model-a"}, want: []string{"human-alpha"}},
		{name: "date", filter: SearchFilter{Date: "2026-06-02", Timezone: "UTC"}, want: []string{"auto-beta"}},
		{name: "range", filter: SearchFilter{DateFrom: "2026-06-02", DateTo: "2026-06-03", Timezone: "UTC"}, want: []string{"auto-beta", "one-shot"}},
		{name: "exclude one shot", filter: SearchFilter{IncludeOneShot: boolPointer(false)}, want: []string{"auto-beta", "human-alpha"}},
		{name: "exclude automated", filter: SearchFilter{IncludeAutomated: boolPointer(false)}, want: []string{"human-alpha", "one-shot"}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			filter := test.filter
			filter.Query = "canonical"
			filter.Limit = 20
			page, err := database.Search(context.Background(), filter)
			require.NoError(t, err)
			assert.Equal(t, test.want, sortedSearchSessionIDs(page.Results))
		})
	}
}

func TestSessionListCanonicalModelFilter(t *testing.T) {
	database := testDB(t)
	seedCanonicalFilterSession(t, database, filterFixture{
		id: "model-a-session", project: "alpha", agent: "claude",
		model: "model-a", date: "2026-06-01", userMessages: 2,
	}, "model a")
	seedCanonicalFilterSession(t, database, filterFixture{
		id: "model-b-session", project: "beta", agent: "codex",
		model: "model-b", date: "2026-06-02", userMessages: 2,
	}, "model b")

	page, err := database.ListSessions(context.Background(), SessionFilter{
		Model: "model-a", IncludeChildren: true, Limit: 20,
	})
	require.NoError(t, err)
	require.Len(t, page.Sessions, 1)
	assert.Equal(t, "model-a-session", page.Sessions[0].ID)
}

func TestRecentEditsCanonicalSessionFilters(t *testing.T) {
	database := testDB(t)
	fixtures := []filterFixture{
		{id: "human-alpha", project: "alpha", agent: "claude", model: "model-a", date: "2026-06-01", userMessages: 2},
		{id: "auto-beta", project: "beta", agent: "codex", model: "model-b", date: "2026-06-02", automated: true, userMessages: 2},
		{id: "one-shot", project: "alpha", agent: "claude", model: "model-c", date: "2026-06-03", userMessages: 1},
	}
	for _, fixture := range fixtures {
		seedEdit(t, database, fixture.project, fixture.id, 1, 0,
			fixture.id+".go", fixture.date+"T10:00:00Z")
		setCanonicalFilterSession(t, database, fixture)
	}

	tests := []struct {
		name   string
		params RecentEditsParams
		want   []string
	}{
		{name: "default includes every class", want: []string{"auto-beta", "human-alpha", "one-shot"}},
		{name: "agent", params: RecentEditsParams{Agent: "codex"}, want: []string{"auto-beta"}},
		{name: "model", params: RecentEditsParams{Model: "model-c"}, want: []string{"one-shot"}},
		{name: "date", params: RecentEditsParams{Date: "2026-06-01", Timezone: "UTC"}, want: []string{"human-alpha"}},
		{name: "exclude one shot", params: RecentEditsParams{IncludeOneShot: boolPointer(false)}, want: []string{"auto-beta", "human-alpha"}},
		{name: "exclude automated", params: RecentEditsParams{IncludeAutomated: boolPointer(false)}, want: []string{"human-alpha", "one-shot"}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result, err := database.RecentEdits(context.Background(), test.params)
			require.NoError(t, err)
			assert.Equal(t, test.want, sortedRecentSessionIDs(result))
		})
	}
}

func TestPinnedMessagesCanonicalSessionFilters(t *testing.T) {
	database := testDB(t)
	fixtures := []filterFixture{
		{id: "human-alpha", project: "alpha", agent: "claude", model: "model-a", date: "2026-06-01", userMessages: 2},
		{id: "auto-beta", project: "beta", agent: "codex", model: "model-b", date: "2026-06-02", automated: true, userMessages: 2},
		{id: "one-shot", project: "alpha", agent: "claude", model: "model-c", date: "2026-06-03", userMessages: 1},
	}
	for _, fixture := range fixtures {
		seedCanonicalFilterSession(t, database, fixture, "pinned content")
		pinFirstMessage(t, database, fixture.id)
	}

	tests := []struct {
		name   string
		params PinnedMessagesParams
		want   []string
	}{
		{name: "default includes every class", want: []string{"auto-beta", "human-alpha", "one-shot"}},
		{name: "project", params: PinnedMessagesParams{Project: "beta"}, want: []string{"auto-beta"}},
		{name: "agent", params: PinnedMessagesParams{Agent: "codex"}, want: []string{"auto-beta"}},
		{name: "model", params: PinnedMessagesParams{Model: "model-a"}, want: []string{"human-alpha"}},
		{name: "date", params: PinnedMessagesParams{Date: "2026-06-03", Timezone: "UTC"}, want: []string{"one-shot"}},
		{name: "exclude one shot", params: PinnedMessagesParams{IncludeOneShot: boolPointer(false)}, want: []string{"auto-beta", "human-alpha"}},
		{name: "exclude automated", params: PinnedMessagesParams{IncludeAutomated: boolPointer(false)}, want: []string{"human-alpha", "one-shot"}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pins, err := database.ListPinnedMessagesFiltered(context.Background(), test.params)
			require.NoError(t, err)
			assert.Equal(t, test.want, sortedPinnedSessionIDs(pins))
		})
	}
}

func TestRecallEntriesCanonicalSessionFilters(t *testing.T) {
	database := testDB(t)
	fixtures := []filterFixture{
		{id: "human-alpha", project: "alpha", agent: "claude", model: "model-a", date: "2026-06-01", userMessages: 2},
		{id: "auto-beta", project: "beta", agent: "codex", model: "model-b", date: "2026-06-02", automated: true, userMessages: 2},
		{id: "one-shot", project: "alpha", agent: "claude", model: "model-c", date: "2026-06-03", userMessages: 1},
	}
	for _, fixture := range fixtures {
		seedCanonicalFilterSession(t, database, fixture, "recall source")
		_, err := database.InsertRecallEntry(RecallEntry{
			ID: fixture.id + "-recall", Type: "fact", Scope: "project",
			Status: "accepted", Title: fixture.id, Body: "canonical recall",
			Project: fixture.project, Agent: fixture.agent,
			SourceSessionID: fixture.id,
		})
		require.NoError(t, err)
	}

	tests := []struct {
		name  string
		query RecallQuery
		want  []string
	}{
		{name: "default includes every class", want: []string{"auto-beta-recall", "human-alpha-recall", "one-shot-recall"}},
		{name: "project", query: RecallQuery{Project: "beta"}, want: []string{"auto-beta-recall"}},
		{name: "agent", query: RecallQuery{Agent: "codex"}, want: []string{"auto-beta-recall"}},
		{name: "model", query: RecallQuery{Model: "model-c"}, want: []string{"one-shot-recall"}},
		{name: "date", query: RecallQuery{Date: "2026-06-01", Timezone: "UTC"}, want: []string{"human-alpha-recall"}},
		{name: "exclude one shot", query: RecallQuery{IncludeOneShot: boolPointer(false)}, want: []string{"auto-beta-recall", "human-alpha-recall"}},
		{name: "exclude automated", query: RecallQuery{IncludeAutomated: boolPointer(false)}, want: []string{"human-alpha-recall", "one-shot-recall"}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			entries, err := database.ListRecallEntries(context.Background(), test.query)
			require.NoError(t, err)
			assert.Equal(t, test.want, sortedRecallIDs(entries))
		})
	}
}

func TestValidateRecallQueryRejectsInvalidSessionFilters(t *testing.T) {
	tests := []RecallQuery{
		{Date: "2026-99-01"},
		{DateFrom: "2026-06-02", DateTo: "2026-06-01"},
		{ActiveSince: "yesterday"},
		{Timezone: "Not/A-Timezone"},
	}
	for _, query := range tests {
		require.ErrorIs(t, ValidateRecallQuery(query), ErrInvalidRecallQuery)
	}
}
