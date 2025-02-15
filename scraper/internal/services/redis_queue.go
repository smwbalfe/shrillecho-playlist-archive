package service

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/redis/go-redis/v9"
	"time"
)

type RedisQueue struct {
	client redis.UniversalClient
}

func NewRedisQueue(client redis.UniversalClient) *RedisQueue {
	return &RedisQueue{
		client: client,
	}
}

func (q RedisQueue) Enqueue(ctx context.Context, job *ScrapeJob) error {
	jobBytes, err := json.Marshal(job)
	if err != nil {
		return err
	}
	return q.client.LPush(ctx, "scrape_queue", jobBytes).Err()
}

func (q RedisQueue) Dequeue(ctx context.Context) (*ScrapeJob, error) {
	result, err := q.client.BRPop(ctx, 0, "scrape_queue").Result()
	if err != nil {
		return nil, err
	}
	var job ScrapeJob
	if err := json.Unmarshal([]byte(result[1]), &job); err != nil {
		return nil, err
	}
	return &job, nil
}

func (q RedisQueue) UpdateJob(ctx context.Context, job *ScrapeJob) error {
	jobBytes, err := json.Marshal(job)
	if err != nil {
		return err
	}
	return q.client.Set(ctx, fmt.Sprintf("job:%s", job.ID), jobBytes, 24*time.Hour).Err()
}

func (q RedisQueue) GetJob(ctx context.Context, jobID int64) (*ScrapeJob, error) {
	result, err := q.client.Get(ctx, fmt.Sprintf("job:%s", jobID)).Result()
	if err != nil {
		return nil, err
	}
	var job ScrapeJob
	if err := json.Unmarshal([]byte(result), &job); err != nil {
		return nil, err
	}
	return &job, nil
}
