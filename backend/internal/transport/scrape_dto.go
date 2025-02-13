package transport

import "gitlab.com/smwbalfe/spotify-client/data"

type ScrapeRequest struct {
	Artist string `json:"artist"`
	Depth  int    `json:"depth"`
}

type ScrapeResponse struct {
	Artists []data.Artist `json:"artists"`
}
