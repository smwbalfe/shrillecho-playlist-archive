package workers

import (
	"backend/internal/config"
	"backend/internal/repository"
	"backend/internal/services"
	"backend/internal/transport"
	"context"
	"fmt"
	"log"
	"sync"

	"github.com/gorilla/websocket"
	client "gitlab.com/smwbalfe/spotify-client"
)

type ArtistScrapeWorker struct {
	Spotify    *client.SpotifyClient
	Scraper    *service.ArtistScraperService
	Queue      *service.RedisQueue
	artistRepo repository.PostgresArtistRepository
	scrapeRepo repository.PostgresScrapeRepository
	wsConn *websocket.Conn
    wsMutex sync.Mutex
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

func (w *ArtistScrapeWorker) SetWebsocketConnection(conn *websocket.Conn) {
    w.wsMutex.Lock()
    defer w.wsMutex.Unlock()
    w.wsConn = conn
}

func (scrp *ArtistScrapeWorker) ProcessScrapeQueue(queueCtx context.Context) {
	for {
		select {
		case <-queueCtx.Done():
			return
		default:
			
			var scrapeJob service.ScrapeJob

			err := scrp.Queue.PopRequest(queueCtx, &scrapeJob)

			if err != nil {
				log.Printf("Error dequeuing job: %v", err)
				scrapeJob.Status = "failure"
				scrapeJob.Error = err.Error()
				scrp.Queue.PushResponse(queueCtx, &scrapeJob)
			}

			artists, err := scrp.Scraper.TriggerArtistScrape(
				queueCtx, 
				scrapeJob.ID, 
				scrapeJob.Artist, 
				scrapeJob.Depth,
			)

			if err != nil {
				log.Printf("error scraping: %v", err)
				scrapeJob.Status = "failure"
				scrapeJob.Error = err.Error()
				scrp.Queue.PushResponse(queueCtx, &scrapeJob)
			}

			scrapeJob.Status = "success"
			scrapeJob.Artists = artists
			scrp.Queue.PushResponse(queueCtx, &scrapeJob)
		}
	}
}

func (scrp *ArtistScrapeWorker) ProcessResponeQueue(queueCtx context.Context) {
	for {
		select {
		case <-queueCtx.Done():
			return
		default:
			
			var scrapeJob service.ScrapeJob

			err := scrp.Queue.PopResponse(queueCtx, &scrapeJob)

			if err != nil {
				fmt.Printf("invalid response received: %v", err)
				fmt.Println(scrapeJob)
			}

			fmt.Printf("received response: %v", len(scrapeJob.Artists))

			var wg sync.WaitGroup

			for _, artist := range scrapeJob.Artists {
				wg.Add(1)
				currentArtist := artist
				
				go func() {
					defer wg.Done()
					artistID, _ := scrp.artistRepo.CreateArtist(queueCtx, currentArtist.ID)
					scrp.scrapeRepo.CreateScrapeArtist(queueCtx, scrapeJob.ID, artistID)
				}()
			}

			wg.Wait()

			if scrp.wsConn != nil {
				
				wsResponse := transport.ArtistWsResponse {
					ID: int(scrapeJob.ID),
					Depth: scrapeJob.Depth,
					SeedArtist: scrapeJob.Artist,
					TotalArtists: len(scrapeJob.Artists) ,
				}

				scrp.wsConn.WriteJSON(wsResponse)
			} else {
				panic("no websocket")
			}
		}
	}
}
