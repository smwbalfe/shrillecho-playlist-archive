package config

import (
	"github.com/redis/go-redis/v9"
	client "github.com/smwbalfe/shrillecho-playlist-archive/backend/pkg/client"
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
