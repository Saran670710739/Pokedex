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
	// โหลด Environment Variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// เชื่อมต่อ Supabase
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := database.Connect(ctx)
	if err != nil {
		log.Fatal("Database connection error:", err)
	}
	defer db.Close()

	log.Println("Connected to Supabase successfully!")

	mux := http.NewServeMux()

	pokemonHandler := &handler.PokemonHandler{DB: db}
	mux.HandleFunc("GET /api/pokemon", pokemonHandler.GetPokemon)

	mux.HandleFunc("GET /api/pokemon/{id}", pokemonHandler.GetPokemonDetail)
	// Health Check
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
			http.Error(w, `{"status":"error","message":"Database unavailable"}`, http.StatusServiceUnavailable)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(HealthResponse{
			Status:  "success",
			Message: "Supabase database connected",
		})
	})

	log.Println("Pokedex Backend running on :8080")

	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}
