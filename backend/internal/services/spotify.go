package service

import (
	"backend/internal/domain"
	"backend/internal/utils"
	"fmt"
	"sync"

	"github.com/rs/zerolog/log"
	client "gitlab.com/smwbalfe/spotify-client"
	"gitlab.com/smwbalfe/spotify-client/data"
)

type SpotifyService struct {
	spotify *client.SpotifyClient
}

func NewSpotifyService(spotify *client.SpotifyClient) SpotifyService {
	return SpotifyService{
		spotify: spotify,
	}
}

func (srv *SpotifyService) GetArtistGenres(artistIDs []string) ([]string, error) {
	artistsExpanded, err := srv.spotify.GetArtists(artistIDs)
	if err != nil {
		return []string{}, err
	}
	uniqueGenres := make(map[string]bool)
	for _, artist := range artistsExpanded.Artists {
		for _, genre := range artist.Genres {
			uniqueGenres[genre] = true
		}
	}
	result := make([]string, 0, len(uniqueGenres))
	for genre := range uniqueGenres {
		result = append(result, genre)
	}
	return result, nil
}

func (srv *SpotifyService) GetArtistName(artist string) (string, error) {

	parsedID, err := utils.ExtractSpotifyID(artist)

	if err != nil {
		return "", err
	}
	artistSingle, err := srv.spotify.GetArtists([]string{parsedID})
	if err != nil {
		return "", err
	}
	return artistSingle.Artists[0].Name, nil
}

func (srv *SpotifyService) GetPlaylistGenres(playlistID string) ([]string, error) {
	tracks, err := srv.spotify.GetPlaylistTracksExpanded(playlistID)
	if err != nil {
		return []string{}, err
	}
	var artists []string
	for _, track := range tracks {
		if len(track.Artists.Items) > 0 {
			artists = append(artists, utils.ExtractSpotifyIDColon(track.Artists.Items[0].URI))
		}
	}
	artistsExpanded, err := srv.spotify.GetArtists(artists)
	if err != nil {
		return []string{}, err
	}
	uniqueGenres := make(map[string]bool)
	for _, artist := range artistsExpanded.Artists {
		for _, genre := range artist.Genres {
			uniqueGenres[genre] = true
		}
	}
	result := make([]string, 0, len(uniqueGenres))
	for genre := range uniqueGenres {
		result = append(result, genre)
	}
	return result, nil
}

func (srv *SpotifyService) FilterPlaylistByGenres(playlistIDs []string, targetGenres []string) ([]data.Track, error) {
	var allTracks []data.Track
	for _, pl := range playlistIDs {
		tracks, err := srv.spotify.GetPlaylistTracksExpanded(pl)
		if err != nil {
			return []data.Track{}, err
		}
		allTracks = append(allTracks, tracks...)
	}
	trackArtistMap := make(map[string][]string)
	var artists []string
	for _, track := range allTracks {
		trackID := utils.ExtractSpotifyIDColon(track.URI)
		for _, artist := range track.Artists.Items {
			artistID := utils.ExtractSpotifyIDColon(artist.URI)
			artists = append(artists, artistID)
			trackArtistMap[trackID] = append(trackArtistMap[trackID], artistID)
		}
	}
	artistsExpanded, err := srv.spotify.GetArtists(artists)
	if err != nil {
		return []data.Track{}, err
	}
	artistGenres := make(map[string][]string)
	for _, artist := range artistsExpanded.Artists {
		artistID := utils.ExtractSpotifyIDColon(artist.URI)
		artistGenres[artistID] = artist.Genres
	}
	var matchingTracks []data.Track
	for trackID, trackArtists := range trackArtistMap {
		for _, artistID := range trackArtists {
			for _, genre := range artistGenres[artistID] {
				for _, targetGenre := range targetGenres {
					if genre == targetGenre {
						for _, track := range allTracks {
							if utils.ExtractSpotifyIDColon(track.URI) == trackID {
								matchingTracks = append(matchingTracks, track)
								goto nextTrack
							}
						}
					}
				}
			}
		}
	nextTrack:
	}
	return matchingTracks, nil
}

func (srv *SpotifyService) RemoveKnownTracks(targetTracks []domain.SimpleTrack, removeTracks []domain.SimpleTrack) ([]domain.SimpleTrack, error) {
	removeMap := make(map[string]struct{})
	for _, track := range removeTracks {
		name, artistURI := utils.GetTrackMetadataSimple(track)
		key := name + "|" + artistURI
		removeMap[key] = struct{}{}
	}
	var dedupedTracks []domain.SimpleTrack
	for _, track := range targetTracks {
		name, artistURI := utils.GetTrackMetadataSimple(track)
		key := name + "|" + artistURI
		if _, exists := removeMap[key]; !exists {
			dedupedTracks = append(dedupedTracks, track)
		}
	}
	return dedupedTracks, nil
}

func (srv *SpotifyService) GetArtistDiscoveredOn(artists []string, semaphore chan struct{}) []data.PlaylistArchiveItem {
	var mu sync.Mutex
	var wg sync.WaitGroup
	var totalPlaylists []data.PlaylistArchiveItem
	errCh := make(chan error, len(artists))
	for _, artist := range artists {
		wg.Add(1)
		go func(artist string) {
			defer wg.Done()
			semaphore <- struct{}{}
			playlists, err := srv.spotify.GetDiscoveredOn(artist)
			<-semaphore
			if err != nil {
				errCh <- fmt.Errorf("failed to get discovered on for %s: %v", artist, err)
				log.Printf("Failed to process artist %s: %v", artist, err)
				return
			}
			mu.Lock()
			log.Printf("Found %d playlists for artist %s", len(playlists), artist)
			totalPlaylists = append(totalPlaylists, playlists...)
			mu.Unlock()
		}(artist)
	}
	wg.Wait()
	close(errCh)
	for err := range errCh {
		if err != nil {
			log.Printf("Error occurred: %v", err)
		}
	}
	result := client.RemoveDuplicates(totalPlaylists)
	log.Printf("Completed collection. Total playlists before dedup: %d, after dedup: %d", len(totalPlaylists), len(result))
	return result
}

func (srv *SpotifyService) GetPlaylistTracks(playlists []data.PlaylistArchiveItem) []data.Track {
	concurrencyLimit := 100
	sem := make(chan struct{}, concurrencyLimit)
	var wg sync.WaitGroup
	var allTracks []data.Track
	for _, pl := range playlists {
		wg.Add(1)
		sem <- struct{}{}
		go func(pl data.PlaylistArchiveItem) {
			defer wg.Done()
			defer func() { <-sem }()
			id, err := client.ExtractID(pl.URI)
			if err != nil {
				return
			}
			playlistTracks, err := srv.spotify.GetPlaylistTracksExpanded(id)

			if err != nil {
				log.Printf("Fatal Error: %v", err.Error())
				return
			}

			allTracks = append(allTracks, playlistTracks...)
		}(pl)
	}
	wg.Wait()
	return allTracks
}
