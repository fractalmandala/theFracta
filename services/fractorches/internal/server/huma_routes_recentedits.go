package server

import (
	"context"
	"net/http"

	"go.kenn.io/agentsview/internal/db"
)

type recentEditsInput struct {
	Limit            int               `query:"limit" minimum:"1" maximum:"200" default:"50" doc:"Max files per page"`
	Offset           int               `query:"offset" minimum:"0" default:"0" doc:"Files to skip"`
	Project          string            `query:"project" doc:"Filter by project"`
	Search           string            `query:"search" doc:"Filter by file path substring (case-insensitive)"`
	Agent            string            `query:"agent" doc:"Filter by agent"`
	Model            string            `query:"model" doc:"Comma-separated model filter"`
	Date             string            `query:"date" format:"date" doc:"Filter by activity date"`
	DateFrom         string            `query:"date_from" format:"date" doc:"Activity range start"`
	DateTo           string            `query:"date_to" format:"date" doc:"Activity range end"`
	Timezone         string            `query:"timezone" doc:"IANA timezone for date filters"`
	ActiveSince      string            `query:"active_since" format:"date-time" doc:"Activity timestamp lower bound"`
	IncludeOneShot   optionalBoolParam `query:"include_one_shot" doc:"Include one-shot sessions"`
	IncludeAutomated optionalBoolParam `query:"include_automated" doc:"Include automated sessions"`
}

func (s *Server) registerRecentEditsRoutes() {
	group := newRouteGroup(s.api, "/api/v1", "RecentEdits")
	get(s, group, "/recent-edits", "List recent edits", s.humaRecentEdits)
}

func (s *Server) humaRecentEdits(
	ctx context.Context, in *recentEditsInput,
) (*jsonOutput[db.RecentEditsResult], error) {
	if err := validateDateFilterValues(in.Date, in.DateFrom, in.DateTo, in.ActiveSince); err != nil {
		return nil, err
	}
	timezone, err := db.NormalizeSessionTimezone(in.Timezone)
	if err != nil {
		return nil, apiError(http.StatusBadRequest, err.Error())
	}
	res, err := s.db.RecentEdits(ctx, db.RecentEditsParams{
		Project: in.Project,
		Search:  in.Search,
		Agent:   in.Agent, Model: in.Model, Date: in.Date, DateFrom: in.DateFrom,
		DateTo: in.DateTo, Timezone: timezone, ActiveSince: in.ActiveSince,
		IncludeOneShot:   optionalBoolValue(in.IncludeOneShot),
		IncludeAutomated: optionalBoolValue(in.IncludeAutomated),
		Limit:            in.Limit,
		Offset:           in.Offset,
		MaxEditsPerFile:  20,
	})
	if err != nil {
		return nil, serverError(err)
	}
	return &jsonOutput[db.RecentEditsResult]{Body: res}, nil
}
