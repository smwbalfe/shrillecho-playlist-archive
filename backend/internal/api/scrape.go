package api

import (
	"backend/internal/services"
	"backend/internal/transport"
	"backend/internal/utils"
	"github.com/gofrs/uuid/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"math/rand"
	"net/http"
)

func (a *api) ArtistScrape(w http.ResponseWriter, r *http.Request) {
	var scraperRequest transport.ScrapeRequest
	if err := utils.ParseBody(r, &scraperRequest); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userID, ok := r.Context().Value("user").(uuid.UUID)

	if !ok {
		http.Error(w, "JWT not found in context", http.StatusInternalServerError)
		return
	}

	scrape, err := a.scrapeRepo.CreateScrape(r.Context(), pgtype.UUID{Bytes: userID, Valid: true})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	scrapeID := int64(rand.Intn(1000))

	job := &service.ScrapeJob{
		ID:     scrape,
		Artist: scraperRequest.Artist,
		Depth:  scraperRequest.Depth,
		Status: "pending",
	}

	if err := a.queue.PushRequest(r.Context(), job); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.Json(w, r, transport.ScrapeTriggerResponse{ScrapeID: scrapeID})
}
