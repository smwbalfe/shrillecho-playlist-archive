package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"scraper/internal/config"
	"scraper/internal/db"
	"scraper/internal/repository"
	"scraper/internal/services"
	"scraper/internal/workers"

	"github.com/jackc/pgx/v5"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
	"gitlab.com/smwbalfe/spotify-client"
)

func InitializeServices(dbs *config.DatabaseConnections) (*config.AppServices, error) {
	scrapeRepo := repository.NewPostgresScrapeRepository(dbs.Postgres)
	scrapeQueue := service.NewRedisQueue(dbs.Redis)

	spClient, err := client.NewSpotifyClient()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize spotify client: %w", err)
	}

	return &config.AppServices{
		ScrapeRepo: scrapeRepo,
		Queue:      scrapeQueue,
		Spotify:    &spClient,
	}, nil
}

func InitializeDatabases(env *config.Environment) (*config.DatabaseConnections, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%v:%v", env.RedisHost, env.RedisPort),
		Password: "",
		DB:       0,
	})

	if _, err := rdb.Ping(context.Background()).Result(); err != nil {
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}

	pgConnString := fmt.Sprintf("host=%v user=%v password=%v dbname=%v",
		env.PostgresHost,
		env.PostgresUser,
		env.PostgresPassword,
		env.PostgresDb,
	)
	fmt.Println(pgConnString)


	conn, err := pgx.Connect(context.Background(), pgConnString)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize postgres: %w", err)
	}
	queries := db.New(conn)
	return &config.DatabaseConnections{
		Redis:    rdb,
		Postgres: queries,
		PgConn:   conn,
	}, nil
}

func main() {
    ctx := context.Background()
    apiCfg := config.LoadEnv()
    fmt.Println(apiCfg)
    
    dbs, err := InitializeDatabases(&apiCfg)
    if err != nil {
        log.Fatal().Err(err).Msg("failed to initialize databases")
    }
    defer dbs.PgConn.Close(ctx)
    
    services, err := InitializeServices(dbs)
    if err != nil {
        log.Fatal().Err(err).Msg("failed to initialize services")
    }
    
    sharedCfg := &config.SharedConfig{
        Services: services,
        Dbs:      dbs,
    }
    
    queueCtx, cancel := context.WithCancel(ctx)
    defer cancel()
    
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
    
    artistScraperWorker := workers.NewArtistScrapeWorker(sharedCfg)
    
    numWorkers := 5
    for i := 0; i < numWorkers; i++ {
        go artistScraperWorker.ProcessScrapeQueue(queueCtx)
    }
    
    // Create and enqueue test job
    job := service.ScrapeJob{
        ID:       int64(1),
        ScrapeID: int64(100),
        Artist:   "fart",
        Depth:    2,
        Status:   "pending",
        Error:    "",
        Artists:  nil,
    }
    
    // Enqueue the job
    err = sharedCfg.Services.Queue.Enqueue(ctx, &job)
    if err != nil {
        log.Error().Err(err).Msg("Failed to enqueue job")
        return
    }
    fmt.Printf("Enqueued job with ID: %d\n", job.ID)
    
    // Start a goroutine to poll for job results
    resultChan := make(chan *service.ScrapeJob, 1)
    go func() {
        ticker := time.NewTicker(5 * time.Second)
        defer ticker.Stop()
        
        for {
            select {
            case <-queueCtx.Done():
                return
            case <-ticker.C:
                // Poll for the job result using the same ID
                result, err := sharedCfg.Services.Queue.GetJob(ctx, job.ID)
                if err != nil {
                    if err != redis.Nil {
                        log.Error().Err(err).Msg("Failed to poll job result")
                    }
                    continue
                }
                
                if result.Status != "pending" {
                    resultChan <- result
                    return
                }
                
                log.Info().
                    Int64("jobID", job.ID).
                    Str("status", result.Status).
                    Msg("Job still processing...")
            }
        }
    }()
    
    // Wait for either job completion or shutdown signal
    select {
    case result := <-resultChan:
        log.Info().
            Int64("jobID", result.ID).
            Str("status", result.Status).
            Str("error", result.Error).
            Interface("artists", result.Artists).
            Msg("Job completed")
    case sig := <-sigChan:
        log.Info().Msgf("Received signal: %v", sig)
    }
    
    cancel()
    log.Info().Msg("Shutting down gracefully...")
}