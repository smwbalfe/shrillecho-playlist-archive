package utils

import (
	"backend/internal/domain"
	"context"
	"encoding/json"
	"fmt"
	"github.com/redis/go-redis/v9"
	data "gitlab.com/smwbalfe/spotify-client/data"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

func ResetRedis(rdb *redis.Client, ctx context.Context) error {
	return rdb.FlushAll(ctx).Err()
}

func InitRedis(Addr string) (*redis.Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     Addr,
		Password: "",
		DB:       0,
	})
	if _, err := rdb.Ping(context.Background()).Result(); err != nil {
		return nil, fmt.Errorf("failed to context redis: %v", err)
	}
	return rdb, nil
}

func ExtractPlaylistID(input string) string {
	urlRegex := regexp.MustCompile(`playlist/([a-zA-Z0-9]{22})`)
	if matches := urlRegex.FindStringSubmatch(input); len(matches) > 1 {
		fmt.Println(matches[1])
		return matches[1]
	}
	if strings.HasPrefix(input, "spotify:playlist:") {
		parts := strings.Split(input, ":")
		if len(parts) == 3 && parts[1] == "playlist" {
			fmt.Println(parts[2])
			return parts[2]
		}
	}
	fmt.Println("none")
	return ""
}

func ParseBody(r *http.Request, item any) error {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return err
	}
	defer r.Body.Close()
	if err := json.Unmarshal(body, item); err != nil {
		return err
	}
	return nil
}

func GetTrackMetadata(track data.Track) (string, string) {
	var artist string
	if len(track.Artists.Items) > 0 {
		artist = track.Artists.Items[0].URI
	}
	return track.Name, artist
}

func GetTrackMetadataSimple(track domain.SimpleTrack) (string, string) {
	var artistName string
	if len(track.Artists) > 0 {
		artistName = track.Artists[0].Name
	}
	return track.Name, artistName
}

func Json(w http.ResponseWriter, r *http.Request, item any) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(item); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func ParseQueryInt(queryParam string) (int, error) {
	var paramInt int
	if queryParam != "" {
		var err error
		paramInt, err = strconv.Atoi(queryParam)
		if err != nil {
			return -1, err
		}
	}
	return paramInt, nil
}

func ExtractSpotifyID(input string) (string, error) {
	if !strings.Contains(input, "/") && !strings.Contains(input, "://") {
		return strings.Split(input, "?")[0], nil
	}
	parsedURL, err := url.Parse(input)
	if err != nil {
		return "", err
	}
	segments := strings.Split(parsedURL.Path, "/")
	var id string
	for i := len(segments) - 1; i >= 0; i-- {
		if segments[i] != "" {
			id = segments[i]
			break
		}
	}
	return strings.Split(id, "?")[0], nil
}

func ExtractSpotifyIDColon(uri string) string {
	parts := strings.Split(uri, ":")
	if len(parts) == 3 {
		return parts[2]
	}
	return ""
}

func SortTracksByPlaycount(tracks []data.Track) []domain.SimplifiedTrack {
	simplified := make([]domain.SimplifiedTrack, 0)
	for _, track := range tracks {
		playcount, err := strconv.Atoi(track.Playcount)
		if err != nil || playcount == 0 {
			continue
		}
		coverArtURL := ""
		if len(track.AlbumOfTrack.CoverArt.Sources) > 0 {
			coverArtURL = track.AlbumOfTrack.CoverArt.Sources[0].URL
		}
		simplified = append(simplified, domain.SimplifiedTrack{
			Playcount:   playcount,
			CoverArtURL: coverArtURL,
			Name:        track.Name,
			URI:         track.URI,
		})
	}
	sort.Slice(simplified, func(i, j int) bool {
		return simplified[i].Playcount < simplified[j].Playcount
	})
	return simplified
}

func GetSimpleTrack(track data.Track) domain.SimpleTrack {
	var artists []domain.ArtistSimple
	for _, artist := range track.Artists.Items {
		artists = append(artists, domain.ArtistSimple{
			Name: artist.Profile.Name,
		})
	}
	var sources []domain.Source
	for _, source := range track.AlbumOfTrack.CoverArt.Sources {
		sources = append(sources, domain.Source{
			URL:    source.URL,
			Height: source.Height,
			Width:  source.Width,
		})
	}
	simpleTrack := domain.SimpleTrack{
		Name:      track.Name,
		ID:        track.URI,
		Artists:   artists,
		Playcount: track.Playcount,
		CoverArt: domain.CoverArt{
			Sources: sources,
		},
	}
	return simpleTrack
}
