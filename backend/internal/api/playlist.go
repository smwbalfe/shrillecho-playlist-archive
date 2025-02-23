package api

import (
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/gofrs/uuid/v5"
	"github.com/rs/zerolog/log"

	"backend/internal/utils"
)

func (a *api) CollectPlaylists(w http.ResponseWriter, r *http.Request) {

	userID, ok := r.Context().Value("user").(uuid.UUID)
	if !ok {
		http.Error(w, "no uuid provided, have you registered...", http.StatusInternalServerError)
		return
	}

	limitInt, err := utils.ParseQueryInt(r.URL.Query().Get("limit"))
	if err != nil {
		http.Error(w, "invalid limit parameter", http.StatusBadRequest)
		return
	}

	// pool, err := utils.ParseQueryInt(r.URL.Query().Get("pool"))
	if err != nil {
		http.Error(w, "invalid pool parameter", http.StatusBadRequest)
		return
	}

	playlists, err := a.playlistRepo.FetchCachedPlaylists(r.Context(), userID)
	if len(playlists) == 0 || err != nil {
		fmt.Println(userID)
		artists, err := a.userRepo.GetUserArtists(r.Context(), userID)
	
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		playlists = a.spotifyService.GetArtistDiscoveredOn(artists, make(chan struct{}, 100))
		if err := a.playlistRepo.CachePlaylists(r.Context(), userID, playlists, time.Hour); err != nil {
			log.Printf("Failed to cache playlists: %v", err)
		}
	}
	
	if limitInt > 0 && limitInt < len(playlists) {
		rand.Shuffle(len(playlists), func(i, j int) {
			playlists[i], playlists[j] = playlists[j], playlists[i]
		})
		playlists = playlists[:limitInt]
	}
	if (len(playlists) == 0){
		http.Error(w, "no playlists were found", http.StatusInternalServerError )
		return
	}
	utils.Json(w, r, playlists)
}
