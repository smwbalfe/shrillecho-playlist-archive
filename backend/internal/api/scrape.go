package api

import (
	"math/rand"
	"net/http"
	"time"

	"github.com/gofrs/uuid/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"backend/internal/services"
	"backend/internal/transport"
	"backend/internal/utils"
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

	job := &service.ScrapeJob{
		ID:       int64(rand.Intn(1000)),
		ScrapeID: scrape,
		Artist:   scraperRequest.Artist,
		Depth:    scraperRequest.Depth,
		Status:   "pending",
	}

	if err := a.queue.Enqueue(r.Context(), job); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for i := 0; i < 300; i++ {
		time.Sleep(time.Second)
		result, err := a.queue.GetJob(r.Context(), job.ID)
		if err != nil {
			continue
		}
		if result.Status == "completed" {
			utils.Json(w, r, transport.ScrapeResponse{Artists: result.Artists})
			return
		}
		if result.Status == "failed" {
			http.Error(w, result.Error, http.StatusInternalServerError)
			return
		}
	}
	http.Error(w, "request timeout", http.StatusGatewayTimeout)
}
