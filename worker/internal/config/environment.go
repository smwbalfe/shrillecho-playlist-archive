package config

import (
	"os"
)

type Environment struct {
	RedisHost        string
	RedisPort        string
	PostgresHost     string
	PostgresPassword string
	PostgresUser     string
	PostgresDb       string
}

func LoadEnv() Environment {
	redisHost := os.Getenv("REDIS_HOST")
	postgresHost := os.Getenv("POSTGRES_HOST")
	postgresPassword := os.Getenv("POSTGRES_PASSWORD")
	postgresUser := os.Getenv("POSTGRES_USER")
	postgresDb := os.Getenv("POSTGRES_DB")

	return Environment{
		RedisHost:        redisHost,
		RedisPort:        "6379",
		PostgresHost:     postgresHost,
		PostgresDb:       postgresDb,
		PostgresPassword: postgresPassword,
		PostgresUser:     postgresUser,
	}
}
