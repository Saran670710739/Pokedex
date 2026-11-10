package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/Saran670710739/Pokedex/backend/internal/database"
	"github.com/Saran670710739/Pokedex/backend/internal/handler"
	"github.com/joho/godotenv"
)

type HealthResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func main() {
	// Load Environment Variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Connect to Supabase
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := database.Connect(ctx)
	if err != nil {
		log.Fatal("Database connection error:", err)
	}
	defer db.Close()

	log.Println("Connected to Supabase successfully!")

	// Initialize Auth Handler
	authHandler, err := handler.NewAuthHandler(db)
	if err != nil {
		log.Fatal("Auth configuration error:", err)
	}

	mux := http.NewServeMux()

	// =================================
	// Pokemon API
	// =================================

	pokemonHandler := &handler.PokemonHandler{DB: db}

	mux.HandleFunc("GET /api/pokemon", pokemonHandler.GetPokemon)
	mux.HandleFunc("GET /api/pokemon/{id}", pokemonHandler.GetPokemonDetail)

	// =================================
	// Authentication API
	// =================================

	mux.HandleFunc("POST /api/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)

	mux.Handle(
		"GET /api/auth/me",
		authHandler.RequireAuth(http.HandlerFunc(authHandler.Me)),
	)

	// =================================
	// Favorites API
	// =================================

	favoriteHandler := &handler.FavoriteHandler{DB: db}

	mux.Handle(
		"POST /api/favorites/{pokemon_id}",
		authHandler.RequireAuth(http.HandlerFunc(favoriteHandler.AddFavorite)),
	)

	mux.Handle(
		"DELETE /api/favorites/{pokemon_id}",
		authHandler.RequireAuth(http.HandlerFunc(favoriteHandler.RemoveFavorite)),
	)

	mux.Handle(
		"GET /api/favorites",
		authHandler.RequireAuth(http.HandlerFunc(favoriteHandler.GetFavorites)),
	)

	mux.Handle(
		"GET /api/favorites/check/{pokemon_id}",
		authHandler.RequireAuth(http.HandlerFunc(favoriteHandler.CheckFavorite)),
	)

	// =================================
	// Reviews API
	// =================================

	reviewHandler := &handler.ReviewHandler{DB: db}

	// Public: Get Pokemon reviews
	mux.HandleFunc(
		"GET /api/pokemon/{pokemon_id}/reviews",
		reviewHandler.GetPokemonReviews,
	)

	// Protected: Add review
	mux.Handle(
		"POST /api/pokemon/{pokemon_id}/reviews",
		authHandler.RequireAuth(http.HandlerFunc(reviewHandler.AddReview)),
	)

	// Protected: Update review
	mux.Handle(
		"PUT /api/reviews/{id}",
		authHandler.RequireAuth(http.HandlerFunc(reviewHandler.UpdateReview)),
	)

	// Protected: Delete review
	mux.Handle(
		"DELETE /api/reviews/{id}",
		authHandler.RequireAuth(http.HandlerFunc(reviewHandler.DeleteReview)),
	)

	// =================================
	// Health Check
	// =================================

	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		json.NewEncoder(w).Encode(HealthResponse{
			Status:  "success",
			Message: "Pokedex API is running",
		})
	})

	// Database Health Check
	mux.HandleFunc("GET /api/health/db", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		if err := db.Ping(ctx); err != nil {
			http.Error(
				w,
				`{"status":"error","message":"Database unavailable"}`,
				http.StatusServiceUnavailable,
			)
			return
		}

		w.Header().Set("Content-Type", "application/json")

		json.NewEncoder(w).Encode(HealthResponse{
			Status:  "success",
			Message: "Supabase database connected",
		})
	})

	// Start Server
	log.Println("Pokedex Backend running on :8080")

	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}

}
