package api

import (
	"backend/internal/services"
	"backend/internal/transport"
	"backend/internal/utils"
	"fmt"
	"net/http"

	"github.com/gofrs/uuid/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"gitlab.com/smwbalfe/spotify-client/data"
)

func (a *api) ArtistScrape(w http.ResponseWriter, r *http.Request) {
	var scraperRequest transport.ScrapeRequest
	if err := utils.ParseBody(r, &scraperRequest); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	artistBase62 , err := utils.ParseSpotifyId(scraperRequest.Artist)
	if err != nil {
		http.Error(w, "invalid artist format requested", http.StatusInternalServerError)
		return
	}

	scraperRequest.Artist = artistBase62

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

	fmt.Println(scraperRequest)

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
	

	utils.Json(w, r, transport.ScrapeTriggerResponse{ScrapeID: "yes"})
}

func collectUniqueArtists(tracks []data.Track) []string{
	artistSet:=make(map[string]struct{})
	uniqueArtists:=[]string{}
	for _,track:=range tracks{
		for _,artist:=range track.Artists.Items{
			artistID:=utils.ExtractSpotifyIDColon(artist.URI)
			if _,exists:=artistSet[artistID];!exists{
				artistSet[artistID]=struct{}{}
				uniqueArtists=append(uniqueArtists,artistID)
				if len(uniqueArtists)>=5{
					return uniqueArtists
				}
			}
		}
	}
	return uniqueArtists
}

func (a *api) PlaylistSeededScrape(w http.ResponseWriter, r *http.Request){
	playlistID := r.URL.Query().Get("id")

	userID, ok := r.Context().Value("user").(uuid.UUID)


	if !ok {
		http.Error(w, "JWT not found in context", http.StatusInternalServerError)
		return
	}

	tracks, err := a.spotify.GetPlaylistTracksExpanded(playlistID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(tracks) == 0 {
		http.Error(w, "no tracks", http.StatusInternalServerError)
		return
	}

	artists := collectUniqueArtists(tracks)

	for _, artist := range artists {

		scrape, err := a.scrapeRepo.CreateScrape(r.Context(), pgtype.UUID{Bytes: userID, Valid: true})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		job := &service.ScrapeJob{
			ID:     scrape,
			Artist: artist,
			Depth:  1,
			Status: "pending",
		}

		if err := a.queue.PushRequest(r.Context(), job); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	utils.Json(w, r, transport.ScrapeTriggerResponse{ScrapeID: "yes"})
}
