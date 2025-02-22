package config

import (
	"fmt"
	"os"
)

type Environment struct {
	RedisHost      string
	RedisPort      string
	PostgresHost   string
	AllowedOrigins []string
	ServerHost     string
	ServerPort     string
}

func LoadEnv() Environment {
	env := os.Getenv("ENV")
	isProd := env == "prod"
	fmt.Printf("server running: %v\n", env)
	if isProd {
		return Environment{
			RedisHost:      "redis",
			RedisPort:      "6379",
			PostgresHost:   "db",
			AllowedOrigins: [] string{"https://shrillecho.app"},
			ServerHost:     "",
			ServerPort:     "8000",
		}
	}

	return Environment{
			RedisHost:      "redis",
			RedisPort:      "6379",
			PostgresHost:   "db",
			AllowedOrigins: [] string{"https://shrillecho.app"},
			ServerHost:     "",
			ServerPort:     "8000",
		}

	// return Environment{
	// 	RedisHost:      "104.248.163.15",
	// 	RedisPort:      "6379",
	// 	PostgresHost:   "aws-0-eu-west-2.pooler.supabase.com:6543",
	// 	AllowedOrigins: [] string{"http://localhost:3000", "http://localhost:3000/"},
	// 	ServerHost:     "localhost",
	// 	ServerPort:     "8000",
	// }
}
