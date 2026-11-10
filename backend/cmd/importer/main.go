package main

import (
	"context"
	"log"
	"time"

	"github.com/joho/godotenv"

	"github.com/Saran670710739/Pokedex/backend/internal/database"
	"github.com/Saran670710739/Pokedex/backend/internal/importer"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Cannot load .env file:", err)
	}

	ctx, cancel := context.WithTimeout(
		context.Background(),
		15*time.Minute,
	)
	defer cancel()

	db, err := database.Connect(ctx)
	if err != nil {
		log.Fatal("Database connection failed:", err)
	}
	defer db.Close()

	log.Println("Connected to Supabase")
	log.Println("Starting Pokemon Gen 1 import...")

	if err := importer.ImportPokemon151(ctx, db); err != nil {
		log.Fatal("Import failed:", err)
	}

	log.Println("Starting abilities, moves and egg groups import...")

	if err := importer.ImportPokemonResources(ctx, db); err != nil {
		log.Fatal("Import resources failed:", err)
	}

	log.Println("Starting Pokemon evolution import...")

	if err := importer.ImportPokemonEvolutions(ctx, db); err != nil {
		log.Fatal("Import evolution failed:", err)
	}

	log.Println("Starting type effectiveness import...")

	if err := importer.ImportTypeEffectiveness(ctx, db); err != nil {
		log.Fatal("Import type effectiveness failed:", err)
	}

	log.Println("Successfully imported type effectiveness!")
	log.Println("Successfully imported Pokemon evolutions!")
	log.Println("Successfully imported all 151 Pokemon and resources!")
}
