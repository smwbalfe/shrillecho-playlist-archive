package config

import (
	"github.com/redis/go-redis/v9"
	client "gitlab.com/smwbalfe/spotify-client"
	service "scraper/internal/services"
)

type DatabaseConnections struct {
	Redis *redis.Client
}

type AppServices struct {
	Queue   service.RedisQueue
	Spotify *client.SpotifyClient
}

type SharedConfig struct {
	Services *AppServices
	Dbs      *DatabaseConnections
}
