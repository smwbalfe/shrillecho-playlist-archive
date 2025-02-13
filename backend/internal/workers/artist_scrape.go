package workers

import (
	"context"
	"fmt"
	"log"
	"time"

	client "gitlab.com/smwbalfe/spotify-client"

	"backend/internal/config"
	"backend/internal/repository"
	"backend/internal/services"
)

type ArtistScrapeWorker struct {
	Spotify    *client.SpotifyClient
	Scraper    *service.ArtistScraperService
	Queue      service.Queue
	artistRepo repository.PostgresArtistRepository
	scrapeRepo repository.PostgresScrapeRepository
}

func NewArtistScrapeWorker(sharedCfg *config.SharedConfig) ArtistScrapeWorker {

	artistScraper := service.NewArtistScraperService(sharedCfg.Dbs.Redis, sharedCfg.Services.Spotify, 100)

	artistRepo := repository.NewPostgresArtistRepository(sharedCfg.Dbs.Postgres)

	return ArtistScrapeWorker{
		Spotify:    sharedCfg.Services.Spotify,
		scrapeRepo: sharedCfg.Services.ScrapeRepo,
		artistRepo: artistRepo,
		Queue:      sharedCfg.Services.Queue,
		Scraper:    &artistScraper,
	}
}

func (scrp *ArtistScrapeWorker) ProcessScrapeQueue(queueCtx context.Context) {
	for {
		select {
		case <-queueCtx.Done():
			return
		default:
			job, err := scrp.Queue.Dequeue(queueCtx)
			fmt.Printf("dequeue: %v\n", job.ID)
			if err != nil {
				log.Printf("Error dequeuing job: %v", err)
				time.Sleep(time.Second)
				continue
			}
			job.Status = "processing"
			scrp.Queue.UpdateJob(queueCtx, job)
			artists, err := scrp.Scraper.TriggerArtistScrape(queueCtx, job.ScrapeID, job.Artist, job.Depth)
			if err != nil {
				job.Status = "failed"
				job.Error = err.Error()
				scrp.Queue.UpdateJob(queueCtx, job)
				continue
			}

			for _, artist := range artists {
				artistID, err := scrp.artistRepo.CreateArtist(queueCtx, artist.ID)
				if err != nil {
					log.Fatalf("postgres error: %v", err.Error())
					continue
				}

				err = scrp.scrapeRepo.CreateScrapeArtist(queueCtx, job.ScrapeID, artistID)

				if err != nil {
					log.Fatalf("postgres error: %v", err.Error())
					continue
				}
			}
			job.Status = "completed"
			job.Artists = artists
			scrp.Queue.UpdateJob(queueCtx, job)
		}
	}
}
