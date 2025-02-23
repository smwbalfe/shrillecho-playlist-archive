package main

import (
	"context"
	"fmt"
	"net/http"
	"backend/internal/api"
	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/repository"
	"backend/internal/services"
	"backend/internal/utils"
	"backend/internal/workers"

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

	err := utils.ResetRedis(rdb, context.Background())
	if err != nil {
		panic("failed to reset redis")
	}

	pgConn := fmt.Sprintf(
		"postgres://%v:%v@%v:%v/%v",
		env.PostgresUser,
		env.PostgresPassword,
		env.PostgresDomain,
		env.PostgresPort,
		env.PostgresDb,
	)

	fmt.Println(pgConn)
	conn, err := pgx.Connect(context.Background(), pgConn)
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

	api := api.NewApi(ctx, sharedCfg, &apiCfg)

	artistScraperWorker := workers.NewArtistScrapeWorker(sharedCfg)

	api.SetScrapeWorker(&artistScraperWorker)

	queueCtx, cancel := context.WithCancel(ctx)
	defer cancel()
	// numWorkers := 5
	// for i := 0; i < numWorkers; i++ {
	// 	go artistScraperWorker.ProcessScrapeQueue(queueCtx)
	// }

	go artistScraperWorker.ProcessResponeQueue(queueCtx)

	log.Printf("Starting server on port: %v", apiCfg.ServerPort)
	err = http.ListenAndServe(fmt.Sprintf("%v:%v",apiCfg.ServerHost ,apiCfg.ServerPort), api.Routes())
	if err != nil {
		log.Fatal().Str("error", err.Error()).Msg("failed to start server")
	}
}
