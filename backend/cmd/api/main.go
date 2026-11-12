package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Saran670710739/Pokedex/backend/internal/database"
	"github.com/Saran670710739/Pokedex/backend/internal/handler"
	"github.com/joho/godotenv"
)

type HealthResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// =================================
// CORS Middleware
// =================================

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		allowedOrigins := map[string]bool{
			"http://localhost:3000":                    true,
			"http://127.0.0.1:3000":                    true,
			"https://pokedex-saran-supakit.vercel.app": true,
		}

		// รองรับ Origin จาก Environment Variable
		frontendURLs := strings.Split(os.Getenv("FRONTEND_URL"), ",")

		for _, url := range frontendURLs {
			url = strings.TrimSpace(url)
			if url != "" {
				allowedOrigins[url] = true
			}
		}

		if origin != "" {
			isAllowed := allowedOrigins[origin]

			// อนุญาต Vercel Preview ของโปรเจกต์ Pokedex
			if strings.HasPrefix(origin, "https://pokedex-") &&
				strings.HasSuffix(origin, "-sarans-projects-6ba7b24d.vercel.app") {
				isAllowed = true
			}

			if !isAllowed {
				http.Error(w, "Origin not allowed", http.StatusForbidden)
				return
			}

			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set(
				"Access-Control-Allow-Methods",
				"GET, POST, PUT, PATCH, DELETE, OPTIONS",
			)
			w.Header().Set(
				"Access-Control-Allow-Headers",
				"Content-Type, Authorization",
			)
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// =================================
// Main
// =================================

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

	mux.Handle(
		"PATCH /api/users/me",
		authHandler.RequireAuth(
			http.HandlerFunc(authHandler.UpdateMe),
		),
	)

	mux.Handle(
		"PATCH /api/users/me/password",
		authHandler.RequireAuth(
			http.HandlerFunc(authHandler.ChangePassword),
		),
	)

	// =================================
	// Admin API
	// =================================

	adminHandler := &handler.AdminHandler{DB: db}

	mux.Handle(
		"GET /api/admin/summary",
		authHandler.RequireAdmin(
			http.HandlerFunc(adminHandler.GetSummary),
		),
	)

	mux.Handle(
		"GET /api/admin/users",
		authHandler.RequireAdmin(
			http.HandlerFunc(adminHandler.GetUsers),
		),
	)

	mux.Handle(
		"PUT /api/admin/users/{id}",
		authHandler.RequireAdmin(
			http.HandlerFunc(adminHandler.UpdateUser),
		),
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

	mux.HandleFunc(
		"GET /api/pokemon/{pokemon_id}/reviews",
		reviewHandler.GetPokemonReviews,
	)

	mux.Handle(
		"POST /api/pokemon/{pokemon_id}/reviews",
		authHandler.RequireAuth(http.HandlerFunc(reviewHandler.AddReview)),
	)

	mux.Handle(
		"PUT /api/reviews/{id}",
		authHandler.RequireAuth(http.HandlerFunc(reviewHandler.UpdateReview)),
	)

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

	// =================================
	// Database Health Check
	// =================================

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

	// =================================
	// Start Server
	// =================================

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Pokedex Backend running on port %s", port)

	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		log.Fatal(err)
	}
}
