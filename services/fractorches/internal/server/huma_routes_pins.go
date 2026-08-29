package server

import (
	"context"
	"net/http"

	"go.kenn.io/agentsview/internal/db"
)

func (s *Server) registerPinRoutes() {
	group := newRouteGroup(s.api, "/api/v1", "Pins")

	get(s, group, "/pins", "List pins", s.humaListPins)
	get(s, group, "/sessions/{id}/pins", "List session pins", s.humaListSessionPins)
	post(s, group, "/sessions/{id}/messages/{messageId}/pin", "Pin message", s.humaPinMessage)
	deleteRoute(s, group, "/sessions/{id}/messages/{messageId}/pin", "Unpin message", s.humaUnpinMessage)
}

type pinsInput struct {
	Project          string            `query:"project" doc:"Filter by project"`
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

type pinsResponse struct {
	Pins []db.PinnedMessage `json:"pins"`
}

type pinMessageInput struct {
	ID        string `path:"id" required:"true" doc:"Session ID"`
	MessageID int64  `path:"messageId" required:"true" doc:"Message ordinal"`
	Body      pinRequest
}

type pinMessageResponse struct {
	ID int64 `json:"id"`
}

func (s *Server) humaListPins(
	ctx context.Context,
	in *pinsInput,
) (*jsonOutput[pinsResponse], error) {
	if err := validateDateFilterValues(in.Date, in.DateFrom, in.DateTo, in.ActiveSince); err != nil {
		return nil, err
	}
	timezone, err := db.NormalizeSessionTimezone(in.Timezone)
	if err != nil {
		return nil, apiError(http.StatusBadRequest, err.Error())
	}
	pins, err := s.db.ListPinnedMessagesFiltered(ctx, db.PinnedMessagesParams{
		Project: in.Project, Agent: in.Agent, Model: in.Model, Date: in.Date,
		DateFrom: in.DateFrom, DateTo: in.DateTo, Timezone: timezone,
		ActiveSince: in.ActiveSince, IncludeOneShot: optionalBoolValue(in.IncludeOneShot),
		IncludeAutomated: optionalBoolValue(in.IncludeAutomated),
	})
	if err != nil {
		return nil, internalError("list pins", err)
	}
	if pins == nil {
		pins = []db.PinnedMessage{}
	}
	return &jsonOutput[pinsResponse]{Body: pinsResponse{Pins: pins}}, nil
}

func (s *Server) humaListSessionPins(
	ctx context.Context,
	in *idPathInput,
) (*jsonOutput[pinsResponse], error) {
	pins, err := s.db.ListPinnedMessages(ctx, in.ID, "")
	if err != nil {
		return nil, internalError("list session pins", err)
	}
	if pins == nil {
		pins = []db.PinnedMessage{}
	}
	return &jsonOutput[pinsResponse]{Body: pinsResponse{Pins: pins}}, nil
}

func (s *Server) humaPinMessage(
	_ context.Context,
	in *pinMessageInput,
) (*createdOutput[pinMessageResponse], error) {
	id, err := s.db.PinMessage(in.ID, in.MessageID, in.Body.Note)
	if err != nil {
		if handled := handleHumaReadOnly(err); handled != nil {
			return nil, handled
		}
		return nil, internalError("pin message", err)
	}
	if id == 0 {
		return nil, apiError(http.StatusBadRequest,
			"message does not belong to this session")
	}
	return &createdOutput[pinMessageResponse]{
		Status: http.StatusCreated,
		Body:   pinMessageResponse{ID: id},
	}, nil
}

func (s *Server) humaUnpinMessage(
	_ context.Context,
	in *messagePathInput,
) (*noContentOutput, error) {
	if err := s.db.UnpinMessage(in.ID, in.MessageID); err != nil {
		if handled := handleHumaReadOnly(err); handled != nil {
			return nil, handled
		}
		return nil, internalError("unpin message", err)
	}
	return &noContentOutput{Status: http.StatusNoContent}, nil
}
