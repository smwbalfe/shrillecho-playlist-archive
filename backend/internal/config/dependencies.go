package config

import (
	"backend/internal/db"
	"backend/internal/repository"
	service "backend/internal/services"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	client "gitlab.com/smwbalfe/spotify-client"
)

type DatabaseConnections struct {
	Redis    *redis.Client
	Postgres *db.Queries
	PgConn   *pgxpool.Pool
}

type AppServices struct {
	ScrapeRepo repository.PostgresScrapeRepository
	Queue      *service.RedisQueue
	Spotify    *client.SpotifyClient
}

type SharedConfig struct {
	Services *AppServices
	Dbs      *DatabaseConnections
}
