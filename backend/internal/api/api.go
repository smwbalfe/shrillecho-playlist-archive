package api

import (
	"context"
	"backend/internal/api/middleware"
	"backend/internal/config"
	"backend/internal/repository"
	"backend/internal/services"

	"github.com/go-chi/chi/v5"
	// middlewarechi "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	client "gitlab.com/smwbalfe/spotify-client"
)

type api struct {
	environment    *config.Environment

	spotify        *client.SpotifyClient

	queue          service.Queue
	spotifyService service.SpotifyService

	scrapeRepo     repository.PostgresScrapeRepository
	userRepo       repository.PostgresUserRepository
	playlistRepo   repository.RedisPlaylistRepository
}

func NewApi(ctx context.Context, sharedCfg *config.SharedConfig, env *config.Environment) *api {

	return &api{
		environment:    env,
		spotify:        sharedCfg.Services.Spotify,
		queue:          sharedCfg.Services.Queue,
		spotifyService: service.NewSpotifyService(sharedCfg.Services.Spotify),
		scrapeRepo:     sharedCfg.Services.ScrapeRepo,
		userRepo:       repository.NewPostgresUserRepository(sharedCfg.Dbs.Postgres),
		playlistRepo:   repository.NewRedisPlaylistRepository(sharedCfg.Dbs.Redis),
	}
}

func (a *api) Routes() *chi.Mux {
    r := chi.NewRouter()
   
    r.Use(cors.Handler(cors.Options{
        AllowedOrigins:   a.environment.AllowedOrigins,
        AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
        ExposedHeaders:   []string{"Link"},
        AllowCredentials: true,
        MaxAge:           300,
    }))
    
    r.Use(middleware.CheckAuth)
    
    r.Route("/scrape", func(r chi.Router) {
        r.Post("/artists", a.ArtistScrape)
        r.Get("/playlists", a.CollectPlaylists)
    })
	
    r.Route("/spotify", func(r chi.Router) {
        r.Get("/playlist", a.PlaylistHandler)
        r.Get("/playlists/genres", a.ReadPlaylistGenres)
        r.Post("/playlist/filter", a.FilterPlaylists)
    })

    r.Route("/users", func(r chi.Router) {
        r.Post("/", a.RegisterUser)
    })

    return r
}
