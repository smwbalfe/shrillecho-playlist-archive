package config

import (
	"github.com/jackc/pgx/v5"
	"github.com/redis/go-redis/v9"
	client "gitlab.com/smwbalfe/spotify-client"
	"scraper/internal/db"
	"scraper/internal/repository"
	service "scraper/internal/services"
)

type DatabaseConnections struct {
	Redis    *redis.Client
	Postgres *db.Queries
	PgConn   *pgx.Conn
}

type AppServices struct {
	ScrapeRepo repository.PostgresScrapeRepository
	Queue      service.Queue
	Spotify    *client.SpotifyClient
}

type SharedConfig struct {
	Services *AppServices
	Dbs      *DatabaseConnections
}
