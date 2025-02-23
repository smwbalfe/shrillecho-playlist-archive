package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
	"github.com/redis/go-redis/v9"
	"gitlab.com/smwbalfe/spotify-client/data"
)

type RedisPlaylistRepository struct {
	redis *redis.Client
}

func NewRedisPlaylistRepository(client *redis.Client) RedisPlaylistRepository {
	return RedisPlaylistRepository{
		redis: client,
	}
}

func (r *RedisPlaylistRepository) FetchCachedPlaylists(ctx context.Context, pool string) ([]data.PlaylistArchiveItem, error) {
	cacheKey := fmt.Sprintf("playlists:%s", pool)
	cached, err := r.redis.Get(ctx, cacheKey).Result()
	if err != nil {
		return nil, err
	}
	var playlists []data.PlaylistArchiveItem
	if err := json.Unmarshal([]byte(cached), &playlists); err != nil {
		return nil, err
	}
	return playlists, nil
}

func (r *RedisPlaylistRepository) CachePlaylists(ctx context.Context, pool string, playlists []data.PlaylistArchiveItem, ttl time.Duration) error {
	cacheKey := fmt.Sprintf("playlists:%s", pool)
	cached, err := json.Marshal(playlists)
	if err != nil {
		return err
	}
	return r.redis.Set(ctx, cacheKey, cached, ttl).Err()
}
