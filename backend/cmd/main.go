package main

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
	"gitlab.com/smwbalfe/spotify-client"

	"backend/internal/api"
	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/repository"
	"backend/internal/services"
	"backend/internal/utils"
	"backend/internal/workers"
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

	err := utils.ResetRedis(rdb, context.Background())
	if err != nil {
		panic("failed to reset redis")
	}
	pgConnString := fmt.Sprintf("host=%v user=%v password=%v dbname=%v",  env.PostgresHost, os.Getenv("POSTGRES_USER"), 
	os.Getenv("POSTGRES_PASSWORD"), os.Getenv("POSTGRES_DB"))
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

	api := api.NewApi(ctx, sharedCfg, &apiCfg)

	
	artistScraperWorker := workers.NewArtistScrapeWorker(sharedCfg)

	queueCtx, cancel := context.WithCancel(ctx)
	defer cancel()
	numWorkers := 5
	for i := 0; i < numWorkers; i++ {
		go artistScraperWorker.ProcessScrapeQueue(queueCtx)
	}

	log.Printf("Starting server on port: %v", os.Getenv("PORT"))
	fmt.Println(apiCfg.ServerHost, apiCfg.ServerPort)
	err = http.ListenAndServe(fmt.Sprintf("%v:%v",apiCfg.ServerHost ,apiCfg.ServerPort), api.Routes())
	if err != nil {
		log.Fatal().Str("error", err.Error()).Msg("failed to start server")
	}
}
