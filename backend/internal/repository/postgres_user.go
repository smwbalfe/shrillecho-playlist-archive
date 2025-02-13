package repository

import (
	"backend/internal/db"
	"context"
	"github.com/gofrs/uuid/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type PostgresUserRepository struct {
	postgres *db.Queries
}

func NewPostgresUserRepository(postgres *db.Queries) PostgresUserRepository {
	return PostgresUserRepository{
		postgres: postgres,
	}
}

func (r *PostgresUserRepository) GetUserArtists(ctx context.Context, userID uuid.UUID) ([]string, error) {
	return r.postgres.GetUserArtists(ctx, pgtype.UUID{Bytes: userID, Valid: true})
}

func (r *PostgresUserRepository) CreateUser(ctx context.Context, userID uuid.UUID) (pgtype.UUID, error) {
	return r.postgres.CreateUser(ctx, pgtype.UUID{Bytes: userID, Valid: true})
}
