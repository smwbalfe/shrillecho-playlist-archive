package repository

import (
	"context"
	"scraper/internal/db"

	"github.com/jackc/pgx/v5/pgtype"
)

type PostgresScrapeRepository struct {
	postgres *db.Queries
}

func NewPostgresScrapeRepository(pg *db.Queries) PostgresScrapeRepository {
	return PostgresScrapeRepository{
		postgres: pg,
	}
}

func (r *PostgresScrapeRepository) CreateScrape(ctx context.Context, userID pgtype.UUID) (int64, error) {
	return r.postgres.CreateScrape(ctx, userID)
}

func (r *PostgresScrapeRepository) CreateScrapeArtist(ctx context.Context, scrapeId int64, artistID int64) error {
	return r.postgres.CreateScrapeArtist(ctx, db.CreateScrapeArtistParams{
		ScrapeID: scrapeId,
		ArtistID: artistID,
	})
}
