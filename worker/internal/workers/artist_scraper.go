package workers

import (
	"context"
	"fmt"
	"log"
	"scraper/internal/config"
	"scraper/internal/services"
	client "github.com/smwbalfe/shrillecho-playlist-archive/backend/pkg/client"
)

type ArtistScrapeWorker struct {
	Spotify *client.SpotifyClient
	Scraper *service.ArtistScraperService
	Queue   service.RedisQueue
}

func NewArtistScrapeWorker(sharedCfg *config.SharedConfig) ArtistScrapeWorker {

	artistScraper := service.NewArtistScraperService(sharedCfg.Dbs.Redis, sharedCfg.Services.Spotify, 500)

	return ArtistScrapeWorker{
		Spotify: sharedCfg.Services.Spotify,
		Queue:   sharedCfg.Services.Queue,
		Scraper: &artistScraper,
	}
}

func (scrp *ArtistScrapeWorker) ProcessScrapeQueue(queueCtx context.Context, id int) {
	for {
		select {
		case <-queueCtx.Done():
			return
		default:

			var scrapeJob service.ScrapeJob

			err := scrp.Queue.PopRequest(queueCtx, &scrapeJob)
			fmt.Printf("worker %v popping an item\n", id)
			fmt.Println(scrapeJob)

			if err != nil {
				log.Printf("Error dequeuing job: %v\n", err)
				scrapeJob.Status = "failure"
				scrapeJob.Error = err.Error()
				scrp.Queue.PushResponse(queueCtx, &scrapeJob)
			}

			fmt.Printf("worker %v scraping...\n", id)
			artists, err := scrp.Scraper.TriggerArtistScrape(
				queueCtx,
				scrapeJob.ID,
				scrapeJob.Artist,
				scrapeJob.Depth,
			)

			if err != nil {
				log.Printf("error scraping: %v\n", err)
				scrapeJob.Status = "failure"
				scrapeJob.Error = err.Error()
				scrp.Queue.PushResponse(queueCtx, &scrapeJob)
			}

			scrapeJob.Status = "success"
			scrapeJob.Artists = artists
			fmt.Printf("worker %v scraped successfully (scrape id: %v) :)\n", id, scrapeJob.ID)
			fmt.Printf("total: %v", len(scrapeJob.Artist))
			scrp.Queue.PushResponse(queueCtx, scrapeJob)
		}
	}
}
