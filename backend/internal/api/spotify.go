package api

import (
	"backend/internal/domain"
	"backend/internal/transport"
	"backend/internal/utils"
	"net/http"
)

func (a *api) PlaylistHandler(w http.ResponseWriter, r *http.Request) {
	playlistID := r.URL.Query().Get("id")
	playlistTracks, err := a.spotify.GetPlaylistTracksExpanded(playlistID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	sortedTracks := utils.SortTracksByPlaycount(playlistTracks)
	utils.Json(w, r, transport.PlaylistResponse{Playlists: sortedTracks})
}


type CreatePlaylistRequest struct {
	Tracks []string `json:"tracks"`
}

type CreatePlaylistResponse struct {
	Link string `json:"link"`
}


func (a *api) AddToPlaylist(w http.ResponseWriter, r *http.Request){
	var createPlaylist CreatePlaylistRequest
	if err := utils.ParseBody(r, &createPlaylist); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	userID, err := a.spotify.GetCurrentUserID()
	if err != nil {
		panic(err)
	}
	link, err := a.spotify.CreatePlaylistFromTracks(createPlaylist.Tracks, userID)
	if err != nil{
		panic(err)
	}
	utils.Json(w,r, CreatePlaylistResponse{Link: link})
}

func (a *api) ReadPlaylistGenres(w http.ResponseWriter, r *http.Request) {
	playlistID := r.URL.Query().Get("id")
	if playlistID == "" {
		http.Error(w, "no playlist ID provided", http.StatusInternalServerError)
		return
	}
	playlistGenres, err := a.spotifyService.GetPlaylistGenres(playlistID)
	if err != nil {
		http.Error(w, "no playlist ID provided", http.StatusInternalServerError)
		return
	}
	utils.Json(w, r, playlistGenres)
}

func (a *api) FilterPlaylists(w http.ResponseWriter, r *http.Request) {
	var filterRequest transport.FilterPlaylistsRequest
	if err := utils.ParseBody(r, &filterRequest); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var allSimpleTracks []domain.SimpleTrack

	for _, playlist := range filterRequest.PlaylistsToFilter {
		loadedTracks, err := a.spotify.GetPlaylistTracksExpanded(playlist)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		for _, lTrack := range loadedTracks {
			allSimpleTracks = append(allSimpleTracks, utils.GetSimpleTrack(lTrack))
		}
	}

	if len(filterRequest.Genres) > 0 {
		var simpleTracks []domain.SimpleTrack
		tracks, err := a.spotifyService.FilterPlaylistByGenres(filterRequest.PlaylistsToFilter, filterRequest.Genres)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		for _, track := range tracks {
			simpleTracks = append(simpleTracks, utils.GetSimpleTrack(track))
		}
		allSimpleTracks = simpleTracks
	}

	if filterRequest.ApplyUnique {
		var removeTracks []domain.SimpleTrack
		for _, uPlaylist := range filterRequest.PlaylistsToRemove {
			tracks, err := a.spotify.GetPlaylistTracksExpanded(uPlaylist)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			for _, track := range tracks {
				removeTracks = append(removeTracks, utils.GetSimpleTrack(track))
			}
		}
		dedupedTracks, err := a.spotifyService.RemoveKnownTracks(allSimpleTracks, removeTracks)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		allSimpleTracks = dedupedTracks
	}

	_ = min(len(allSimpleTracks), filterRequest.TrackLimit)
	utils.Json(w, r, transport.FilterPlaylistResponse{Tracks: allSimpleTracks})
}
