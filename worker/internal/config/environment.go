package config

import (
	"os"
)

type Environment struct {
	RedisHost string
	RedisPort string
}

func LoadEnv() Environment {
	redisHost := os.Getenv("REDIS_HOST")

	return Environment{
		RedisHost: redisHost,
		RedisPort: "6379",
	}
}
