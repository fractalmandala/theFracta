package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"strings"
	"time"

	"go.kenn.io/agentsview/internal/config"
	"go.kenn.io/agentsview/internal/db"
	"go.kenn.io/agentsview/internal/insight"
	corerecall "go.kenn.io/agentsview/internal/recall"
)

// maxWikiCompileEntries bounds one compile request so the generated prompt
// stays within a model context window. It matches the insights session cap.
const maxWikiCompileEntries = 50

type wikiCompileStatusResponse struct {
	Available          bool     `json:"available"`
	Reason             string   `json:"reason,omitempty"`
	EndpointConfigured bool     `json:"endpoint_configured"`
	Agents             []string `json:"agents"`
}

// handleWikiCompileStatus reports whether the service currently has a
// generation path wiki compilation can use: the configured
// OpenAI-compatible insights endpoint, or an insight agent CLI that resolves
// right now. It never claims availability it has not probed.
func (s *Server) handleWikiCompileStatus(
	w http.ResponseWriter, r *http.Request,
) {
	endpointConfigured := strings.TrimSpace(s.cfg.Insights.Endpoint) != "" &&
		strings.TrimSpace(s.cfg.Insights.Model) != ""
	agents := wikiCompileAgentCandidates(s.cfg.Agent)
	response := wikiCompileStatusResponse{
		Available:          endpointConfigured || len(agents) > 0,
		EndpointConfigured: endpointConfigured,
		Agents:             agents,
	}
	if !response.Available {
		response.Reason = "no OpenAI-compatible endpoint is configured " +
			"and no insight agent CLI was found on PATH"
	}
	writeJSON(w, http.StatusOK, response)
}

// wikiCompileAgentCandidates lists the insight agents a compile run could
// reach at this moment: a configured binary override, or a binary found on
// PATH. Unconfigured, unresolved agent names are left out rather than
// promised.
func wikiCompileAgentCandidates(
	agentCfg map[string]config.AgentConfig,
) []string {
	overrides := insightAgentConfig(agentCfg)
	candidates := make([]string, 0, len(insight.ValidAgentNames))
	for _, name := range insight.ValidAgentNames {
		if override, ok := overrides[name]; ok && override.Binary != "" {
			candidates = append(candidates, name)
			continue
		}
		if path, err := exec.LookPath(name); err == nil && path != "" {
			candidates = append(candidates, name)
		}
	}
	return candidates
}

type wikiCompileRequest struct {
	EntryIDs []string `json:"entry_ids"`
	Topic    string   `json:"topic,omitempty"`
	Agent    string   `json:"agent,omitempty"`
}

type wikiCompileGeneratedBy struct {
	Agent string `json:"agent,omitempty"`
	Model string `json:"model,omitempty"`
}

type wikiCompileEntryProvenance struct {
	ID              string `json:"id"`
	Title           string `json:"title"`
	Type            string `json:"type"`
	ReviewState     string `json:"review_state"`
	ProvenanceOK    bool   `json:"provenance_ok"`
	Project         string `json:"project,omitempty"`
	Agent           string `json:"agent,omitempty"`
	SourceSessionID string `json:"source_session_id"`
	UpdatedAt       string `json:"updated_at"`
}

type wikiCompileResponse struct {
	Markdown    string                       `json:"markdown"`
	Topic       string                       `json:"topic,omitempty"`
	GeneratedBy wikiCompileGeneratedBy       `json:"generated_by"`
	Entries     []wikiCompileEntryProvenance `json:"entries"`
	CompiledAt  string                       `json:"compiled_at"`
}

// handleWikiCompile turns a caller-selected cluster of recall entries into a
// draft wiki article through the same generation machinery insights uses.
// The handler is read-only over the archive: drafts are persisted by the
// client in its own private article store, never here.
func (s *Server) handleWikiCompile(
	w http.ResponseWriter, r *http.Request,
) {
	var req wikiCompileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	agent := strings.TrimSpace(req.Agent)
	if agent == "" {
		agent = "claude"
	}
	if !insight.ValidAgents[agent] {
		writeError(w, http.StatusBadRequest,
			"invalid agent: must be one of "+
				strings.Join(insight.ValidAgentNames, ", "))
		return
	}
	ids, err := normalizeWikiCompileEntryIDs(req.EntryIDs)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	entries, missing, superseded, loadErr := s.loadWikiCompileEntries(
		r.Context(), ids,
	)
	if loadErr != nil {
		if handleContextError(w, loadErr) || handleReadOnly(w, loadErr) {
			return
		}
		writeError(w, http.StatusInternalServerError, loadErr.Error())
		return
	}
	if len(missing) > 0 {
		writeError(w, http.StatusNotFound,
			"unknown recall entry ids: "+strings.Join(missing, ", "))
		return
	}
	if len(superseded) > 0 {
		writeError(w, http.StatusUnprocessableEntity,
			"archived or superseded recall entries cannot ground a wiki "+
				"article: "+strings.Join(superseded, ", "))
		return
	}
	result, genErr := s.generateStreamFunc(
		r.Context(), agent, buildWikiCompilePrompt(entries, req.Topic), nil,
	)
	if genErr != nil {
		if handleContextError(w, genErr) {
			return
		}
		writeError(w, http.StatusBadGateway,
			insightGenerateClientMessage(agent, genErr))
		return
	}
	markdown := strings.TrimSpace(result.Content)
	if markdown == "" {
		writeError(w, http.StatusBadGateway,
			"wiki compiler returned empty output")
		return
	}
	provenance := make(
		[]wikiCompileEntryProvenance, 0, len(entries),
	)
	for _, entry := range entries {
		provenance = append(provenance, wikiCompileEntryProvenance{
			ID:              entry.ID,
			Title:           entry.Title,
			Type:            entry.Type,
			ReviewState:     entry.ReviewState,
			ProvenanceOK:    entry.ProvenanceOK,
			Project:         entry.Project,
			Agent:           entry.Agent,
			SourceSessionID: entry.SourceSessionID,
			UpdatedAt:       entry.UpdatedAt,
		})
	}
	writeJSON(w, http.StatusOK, wikiCompileResponse{
		Markdown: markdown,
		Topic:    strings.TrimSpace(req.Topic),
		GeneratedBy: wikiCompileGeneratedBy{
			Agent: result.Agent, Model: result.Model,
		},
		Entries:    provenance,
		CompiledAt: time.Now().UTC().Format(time.RFC3339),
	})
}

func normalizeWikiCompileEntryIDs(raw []string) ([]string, error) {
	seen := make(map[string]bool, len(raw))
	ids := make([]string, 0, len(raw))
	for _, id := range raw {
		id = strings.TrimSpace(id)
		if id == "" || seen[id] {
			continue
		}
		seen[id] = true
		ids = append(ids, id)
	}
	if len(ids) == 0 {
		return nil, fmt.Errorf(
			"entry_ids must contain at least one recall entry id")
	}
	if len(ids) > maxWikiCompileEntries {
		return nil, fmt.Errorf(
			"entry_ids must contain at most %d recall entry ids",
			maxWikiCompileEntries,
		)
	}
	return ids, nil
}

// loadWikiCompileEntries resolves entry ids against the archive, preserving
// request order. Missing and dead (archived or superseded) ids are reported
// separately so the caller can reject with the exact offending set.
func (s *Server) loadWikiCompileEntries(
	ctx context.Context, ids []string,
) (entries []db.RecallEntry, missing []string, superseded []string, err error) {
	entries = make([]db.RecallEntry, 0, len(ids))
	for _, id := range ids {
		entry, loadErr := s.db.GetRecallEntry(ctx, id)
		if loadErr != nil {
			return nil, nil, nil, loadErr
		}
		if entry == nil {
			missing = append(missing, id)
			continue
		}
		if entry.Status == corerecall.StatusArchived ||
			entry.SupersededByEntryID != "" {
			superseded = append(superseded, id)
			continue
		}
		entries = append(entries, *entry)
	}
	return entries, missing, superseded, nil
}

func buildWikiCompilePrompt(
	entries []db.RecallEntry, topic string,
) string {
	var prompt strings.Builder
	prompt.WriteString(
		"You are compiling a wiki article from recall entries that were " +
			"distilled from AI coding sessions in this archive.\n\n" +
			"Rules:\n" +
			"- Ground every claim in the entries below. Cite the entry " +
			"supporting each claim as [recall:<id>] at the end of the " +
			"sentence it supports.\n" +
			"- Never invent numbers, dates, file paths, or quotes. If the " +
			"entries do not support a detail, leave it out.\n" +
			"- If entries disagree, state the disagreement explicitly " +
			"instead of silently choosing one.\n" +
			"- A claim that rests only on entries whose provenance is not " +
			"verified must be marked with \"(unverified)\".\n" +
			"- Output only the article: one `# Title` heading followed by " +
			"markdown sections. No preamble and no closing remarks.\n\n" +
			"Entries:\n\n",
	)
	for _, entry := range entries {
		fmt.Fprintf(
			&prompt,
			"## [recall:%s] %s\n"+
				"type: %s · review_state: %s · provenance: %s · "+
				"source_session: %s",
			entry.ID,
			entry.Title,
			entry.Type,
			entry.ReviewState,
			wikiCompileProvenanceLabel(entry),
			entry.SourceSessionID,
		)
		if entry.Project != "" {
			fmt.Fprintf(&prompt, " · project: %s", entry.Project)
		}
		if entry.Agent != "" {
			fmt.Fprintf(&prompt, " · agent: %s", entry.Agent)
		}
		fmt.Fprintf(&prompt, "\n\n%s\n", strings.TrimSpace(entry.Body))
		if trigger := strings.TrimSpace(entry.Trigger); trigger != "" {
			fmt.Fprintf(&prompt, "\ntrigger: %s\n", trigger)
		}
		if uncertainty := strings.TrimSpace(entry.Uncertainty); uncertainty != "" {
			fmt.Fprintf(&prompt, "\nuncertainty: %s\n", uncertainty)
		}
		prompt.WriteString("\n")
	}
	trimmedTopic := strings.TrimSpace(topic)
	if trimmedTopic == "" {
		trimmedTopic = "the shared topic these entries describe"
	}
	fmt.Fprintf(
		&prompt,
		"Compile the entries above into one wiki article about: %s\n",
		trimmedTopic,
	)
	return prompt.String()
}

// wikiCompileProvenanceLabel distinguishes a verified entry from one that
// was never verified (no evidence windows) and one whose verification was
// revoked (evidence no longer matches the transcript).
func wikiCompileProvenanceLabel(entry db.RecallEntry) string {
	switch {
	case entry.ProvenanceOK:
		return "verified"
	case len(entry.Evidence) > 0:
		return "revoked"
	default:
		return "unverified"
	}
}
