package transport

import "backend/internal/domain"

type FilterPlaylistsRequest struct {
	PlaylistsToFilter []string `json:"playlists_to_filter"`
	PlaylistsToRemove []string `json:"playlists_to_remove"`
	Genres            []string `json:"genres"`
	ApplyUnique       bool     `json:"tracks"`
	TrackLimit        int      `json:"track_limit"`
}

type FilterPlaylistResponse struct {
	Tracks []domain.SimpleTrack `json:"tracks"`
}
