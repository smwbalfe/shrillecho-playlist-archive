package transport

import (
	models "backend/pkg/client/endpoints/artist/models"
)

type ScrapeRequest struct {
	Artist string `json:"artist"`
	Depth  int    `json:"depth"`
}

type ScrapeResponse struct {
	Artists []models.Artist `json:"artists"`
}

type ScrapeTriggerResponse struct {
	ScrapeID string `json:"triggered"`
}
