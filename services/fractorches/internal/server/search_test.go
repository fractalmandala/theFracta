package server

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go.kenn.io/agentsview/internal/config"
	"go.kenn.io/agentsview/internal/db"
	"go.kenn.io/agentsview/internal/service"
)

func TestPrepareFTSQuery(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name string
		raw  string
		want string
	}{
		{name: "single word quoted", raw: "login", want: `"login"`},
		{name: "multi-word AND of quoted terms", raw: "fix bug", want: `"fix" "bug"`},
		{name: "three words AND", raw: "a b c", want: `"a" "b" "c"`},
		{name: "single hyphen token quoted literal", raw: "error-401", want: `"error-401"`},
		{name: "single colon token quoted literal", raw: "status:500", want: `"status:500"`},
		{name: "embedded quote doubled", raw: `say"hi`, want: `"say""hi"`},
		{name: "exact phrase via leading quote passthrough", raw: `"fix bug"`, want: `"fix bug"`},
		{name: "empty string unchanged", raw: "", want: ""},
		{name: "whitespace only trimmed to empty", raw: "   ", want: ""},
		{name: "leading and trailing space trimmed", raw: "  login  ", want: `"login"`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			assert.Equal(t, tt.want, prepareFTSQuery(tt.raw))
		})
	}
}

// searchSpy captures the SearchFilter passed to Search.
type searchSpy struct {
	db.Store
	filter db.SearchFilter
}

func (s *searchSpy) HasFTS() bool { return true }

func (s *searchSpy) Search(
	_ context.Context, f db.SearchFilter,
) (db.SearchPage, error) {
	s.filter = f
	return db.SearchPage{}, nil
}

func TestHandleSearchSortParam(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name     string
		query    string
		wantSort string
	}{
		{"recency", "q=hello&sort=recency", "recency"},
		{"relevance explicit", "q=hello&sort=relevance", "relevance"},
		{"default", "q=hello", "relevance"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			spy := &searchSpy{}
			srv := &Server{
				cfg:      config.Config{Host: "127.0.0.1"},
				db:       spy,
				sessions: service.NewReadOnlyBackend(spy),
				mux:      http.NewServeMux(),
			}
			srv.routes()
			req := httptest.NewRequest(
				http.MethodGet,
				"/api/v1/search?"+tt.query, nil,
			)
			w := httptest.NewRecorder()
			srv.mux.ServeHTTP(w, req)
			require.Equal(t, http.StatusOK, w.Code, "body: %s", w.Body.String())
			assert.Equal(t, tt.wantSort, spy.filter.Sort)
		})
	}
}

func TestHandleSearchCanonicalSessionFilters(t *testing.T) {
	t.Parallel()
	spy := &searchSpy{}
	srv := &Server{
		cfg:      config.Config{Host: "127.0.0.1"},
		db:       spy,
		sessions: service.NewReadOnlyBackend(spy),
		mux:      http.NewServeMux(),
	}
	srv.routes()
	req := httptest.NewRequest(
		http.MethodGet,
		"/api/v1/search?q=needle&project=proj&agent=codex&model=gpt-5.6-sol"+
			"&date_from=2026-08-01&date_to=2026-08-29&timezone=Asia%2FKolkata"+
			"&active_since=2026-08-01T00%3A00%3A00Z&include_one_shot=false"+
			"&include_automated=true",
		nil,
	)
	w := httptest.NewRecorder()
	srv.mux.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code, "body: %s", w.Body.String())
	assert.Equal(t, "proj", spy.filter.Project)
	assert.Equal(t, "codex", spy.filter.Agent)
	assert.Equal(t, "gpt-5.6-sol", spy.filter.Model)
	assert.Equal(t, "2026-08-01", spy.filter.DateFrom)
	assert.Equal(t, "2026-08-29", spy.filter.DateTo)
	assert.Equal(t, "Asia/Kolkata", spy.filter.Timezone)
	assert.Equal(t, "2026-08-01T00:00:00Z", spy.filter.ActiveSince)
	require.NotNil(t, spy.filter.IncludeOneShot)
	assert.False(t, *spy.filter.IncludeOneShot)
	require.NotNil(t, spy.filter.IncludeAutomated)
	assert.True(t, *spy.filter.IncludeAutomated)
}

func TestHandleSearchRejectsInvalidCanonicalSessionFilters(t *testing.T) {
	t.Parallel()
	for _, path := range []string{
		"/api/v1/search?q=needle&date_from=2026-08-29&date_to=2026-08-01",
		"/api/v1/search?q=needle&timezone=Mars%2FOlympus",
		"/api/v1/search?q=needle&active_since=yesterday",
	} {
		path := path
		t.Run(path, func(t *testing.T) {
			t.Parallel()
			spy := &searchSpy{}
			srv := &Server{
				cfg:      config.Config{Host: "127.0.0.1"},
				db:       spy,
				sessions: service.NewReadOnlyBackend(spy),
				mux:      http.NewServeMux(),
			}
			srv.routes()
			w := httptest.NewRecorder()
			srv.mux.ServeHTTP(w, httptest.NewRequest(http.MethodGet, path, nil))
			assert.Equal(t, http.StatusBadRequest, w.Code, "body: %s", w.Body.String())
		})
	}
}
