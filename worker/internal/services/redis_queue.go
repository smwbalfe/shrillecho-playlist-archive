package service

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/redis/go-redis/v9"
)

type RedisQueue struct {
	Client        redis.UniversalClient
	ResponseQueue string
	RequestQueue  string
}

func NewRedisQueue(client redis.UniversalClient) *RedisQueue {
	if client == nil {
		fmt.Println("WARNING: Redis client is nil during RedisQueue initialization!")
	} else {
		fmt.Println("Redis client successfully initialized")
	}

	return &RedisQueue{
		Client:        client,
		ResponseQueue: "response_queue",
		RequestQueue:  "request_queue",
	}
}

func (q *RedisQueue) PopRequest(ctx context.Context, result interface{}) error {
	resp, err := q.Client.BRPop(ctx, 0, q.RequestQueue).Result()
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(resp[1]), result)
}

func (q *RedisQueue) PushResponse(ctx context.Context, item interface{}) error {
	bytes, err := json.Marshal(item)
	if err != nil {
		return err
	}
	return q.Client.LPush(ctx, q.ResponseQueue, bytes).Err()
}
