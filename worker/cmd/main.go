package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"scraper/internal/config"
	"scraper/internal/db"
	"scraper/internal/repository"
	"scraper/internal/services"
	"scraper/internal/workers"
	"sync"
	"syscall"
	"time"

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
    
    var activeWorkers sync.WaitGroup

    numWorkers := 5
    for i := 0; i < numWorkers; i++ {
        activeWorkers.Add(1)
        go func(workerID int) {
            defer activeWorkers.Done()
            log.Info().Int("worker_id", workerID).Msg("Starting worker")
            artistScraperWorker.ProcessScrapeQueue(queueCtx)
        }(i)
    }


    sig := <-sigChan
    log.Info().Str("signal", sig.String()).Msg("Received shutdown signal")
    

    log.Info().Msg("Initiating graceful shutdown...")
    cancel()
    
    shutdownTimeout := 30 * time.Second
    done := make(chan struct{})
    go func() {
        activeWorkers.Wait()
        close(done)
    }()
    select {
    case <-done:
        log.Info().Msg("All workers completed successfully")
    case <-time.After(shutdownTimeout):
        log.Warn().Msg("Shutdown timed out, some workers may not have completed cleanly")
    }
    log.Info().Msg("Application shutdown complete")
}