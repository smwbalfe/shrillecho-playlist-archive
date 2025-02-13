package transport

import (
	"backend/internal/domain"
)

type PlaylistResponse struct {
	Playlists []domain.SimplifiedTrack
}
