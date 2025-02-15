package scrape

import (
	"context"
	"fmt"
	"github.com/rs/zerolog/log"
	sp "gitlab.com/smwbalfe/spotify-client"
	data "gitlab.com/smwbalfe/spotify-client/data"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"sync"
	"sync/atomic"
)

func CollectPlaylists(artists []string, client *sp.SpotifyClient, semaphore chan struct{}) []data.PlaylistArchiveItem {
	log.Printf("Starting playlist collection for %d artists", len(artists))
	var mu sync.Mutex
	var wg sync.WaitGroup
	var totalPlaylists []data.PlaylistArchiveItem
	errCh := make(chan error, len(artists))
	for _, artist := range artists {
		wg.Add(1)
		go func(artist string) {
			defer wg.Done()
			log.Printf("Processing artist: %s", artist)
			semaphore <- struct{}{}
			playlists, err := client.GetDiscoveredOn(artist)
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
	result := sp.RemoveDuplicates(totalPlaylists)
	log.Printf("Completed collection. Total playlists before dedup: %d, after dedup: %d", len(totalPlaylists), len(result))
	return result
}

func IndexPlaylists(mongoClient *mongo.Client, client *sp.SpotifyClient, playlists []data.PlaylistArchiveItem) {
	sem := make(chan struct{}, 741)
	var wg sync.WaitGroup
	var processedCount atomic.Int64
	tracksCollection := mongoClient.Database("spotify").Collection("tracks")
	playlistsCollection := mongoClient.Database("spotify").Collection("playlists")
	for _, playlist := range playlists {
		wg.Add(1)
		playlistCopy := playlist
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			playlistID, err := sp.ExtractID(playlistCopy.URI)
			if err != nil {
				log.Error().Err(err).Str("playlist", playlistCopy.URI).Msg("failed to extract playlist id")
				return
			}
			playlistBSON, err := bson.Marshal(playlistCopy)
			if err != nil {
				log.Error().Err(err).Msg("failed to marshal playlist to BSON")
				return
			}
			filter := bson.M{"_id": playlistID}
			update := bson.M{"$set": bson.M{"playlist": bson.Raw(playlistBSON)}}
			opts := options.Update().SetUpsert(true)

			_, err = playlistsCollection.UpdateOne(
				context.Background(),
				filter,
				update,
				opts,
			)

			if err != nil {
				log.Error().Err(err).Str("playlist", playlistCopy.URI).Msg("failed to store playlist")
				return
			}

			tracks, err := client.GetPlaylistTracks(playlistID)
			if err != nil {
				log.Error().Err(err).Str("playlist", playlistCopy.URI).Msg("failed to get playlist tracks")
				return
			}

			for _, trackURI := range tracks {
				trackID, err := sp.ExtractID(trackURI)
				if err != nil {
					log.Error().Str("id", trackURI).Msg("failed to extract track id")
					continue
				}

				playlistBSON, err := bson.Marshal(playlistCopy)
				if err != nil {
					log.Error().Err(err).Msg("failed to marshal playlist to BSON")
					continue
				}

				filter := bson.M{"_id": trackID}
				update := bson.M{
					"$addToSet": bson.M{
						"playlists": bson.M{
							"$each": []interface{}{
								bson.Raw(playlistBSON),
							},
						},
					},
				}
				opts := options.Update().SetUpsert(true)
				_, err = tracksCollection.UpdateOne(
					context.Background(),
					filter,
					update,
					opts,
				)
				if err != nil {
					log.Error().Err(err).Str("track", trackURI).Str("playlist", playlistCopy.URI).Msg("failed to add track to playlist")
					continue
				}
			}
			current := processedCount.Add(1)
			log.Info().Str("playlist_id", playlistCopy.URI).Int64("processed_count", current).Int("total_playlists", len(playlists)).Msg("processed playlist")
		}()
	}
	wg.Wait()
}
