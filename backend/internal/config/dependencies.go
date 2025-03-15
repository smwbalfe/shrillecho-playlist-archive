package config

import (
	"github.com/smwbalfe/shrillecho-playlist-archive/backend/internal/db"
	"github.com/smwbalfe/shrillecho-playlist-archive/backend/internal/repository"
	service "github.com/smwbalfe/shrillecho-playlist-archive/backend/internal/services"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	client "github.com/smwbalfe/shrillecho-playlist-archive/backend/pkg/client"
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
