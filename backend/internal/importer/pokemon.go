package importer

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const apiURL = "https://pokeapi.co/api/v2"

type NamedResource struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

type PokemonResponse struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Height int    `json:"height"`
	Weight int    `json:"weight"`

	Sprites struct {
		FrontDefault *string `json:"front_default"`
		Other        struct {
			OfficialArtwork struct {
				FrontDefault *string `json:"front_default"`
				FrontShiny   *string `json:"front_shiny"`
			} `json:"official-artwork"`
		} `json:"other"`
	} `json:"sprites"`

	Types []struct {
		Slot int           `json:"slot"`
		Type NamedResource `json:"type"`
	} `json:"types"`

	Stats []struct {
		BaseStat int           `json:"base_stat"`
		Stat     NamedResource `json:"stat"`
	} `json:"stats"`
}

type SpeciesResponse struct {
	CaptureRate  int  `json:"capture_rate"`
	HatchCounter int  `json:"hatch_counter"`
	GenderRate   int  `json:"gender_rate"`
	IsLegendary  bool `json:"is_legendary"`
	IsMythical   bool `json:"is_mythical"`

	Genera []struct {
		Genus    string `json:"genus"`
		Language struct {
			Name string `json:"name"`
		} `json:"language"`
	} `json:"genera"`

	FlavorTextEntries []struct {
		FlavorText string `json:"flavor_text"`
		Language   struct {
			Name string `json:"name"`
		} `json:"language"`
	} `json:"flavor_text_entries"`
}

var httpClient = &http.Client{
	Timeout: 30 * time.Second,
}

func fetchJSON(ctx context.Context, url string, target any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("API returned status %d: %s", resp.StatusCode, url)
	}

	return json.NewDecoder(resp.Body).Decode(target)
}

func resourceID(url string) (int, error) {
	parts := strings.Split(strings.TrimRight(url, "/"), "/")
	return strconv.Atoi(parts[len(parts)-1])
}

func getEnglishSpeciesData(s SpeciesResponse) (string, string) {
	var genus, description string

	for _, item := range s.Genera {
		if item.Language.Name == "en" {
			genus = item.Genus
			break
		}
	}

	for _, item := range s.FlavorTextEntries {
		if item.Language.Name == "en" {
			description = strings.Join(strings.Fields(
				strings.NewReplacer("\n", " ", "\f", " ").Replace(item.FlavorText),
			), " ")
			break
		}
	}

	return genus, description
}

func insertPokemon(
	ctx context.Context,
	db *pgxpool.Pool,
	p PokemonResponse,
	s SpeciesResponse,
) error {
	genus, description := getEnglishSpeciesData(s)

	_, err := db.Exec(ctx, `
		INSERT INTO pokemons (
			id, name, genus, description,
			height, weight, artwork_url,
			shiny_artwork_url, front_image_url,
			capture_rate, hatch_counter, gender_rate,
			is_legendary, is_mythical
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12, $13, $14
		)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			genus = EXCLUDED.genus,
			description = EXCLUDED.description,
			height = EXCLUDED.height,
			weight = EXCLUDED.weight,
			artwork_url = EXCLUDED.artwork_url,
			shiny_artwork_url = EXCLUDED.shiny_artwork_url,
			front_image_url = EXCLUDED.front_image_url,
			capture_rate = EXCLUDED.capture_rate,
			hatch_counter = EXCLUDED.hatch_counter,
			gender_rate = EXCLUDED.gender_rate,
			is_legendary = EXCLUDED.is_legendary,
			is_mythical = EXCLUDED.is_mythical,
			updated_at = NOW()
	`,
		p.ID, p.Name, genus, description,
		float64(p.Height)/10,
		float64(p.Weight)/10,
		p.Sprites.Other.OfficialArtwork.FrontDefault,
		p.Sprites.Other.OfficialArtwork.FrontShiny,
		p.Sprites.FrontDefault,
		s.CaptureRate, s.HatchCounter, s.GenderRate,
		s.IsLegendary, s.IsMythical,
	)

	return err
}

func insertTypesAndStats(
	ctx context.Context,
	db *pgxpool.Pool,
	p PokemonResponse,
) error {
	tx, err := db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx,
		`DELETE FROM pokemon_types WHERE pokemon_id = $1`, p.ID,
	); err != nil {
		return err
	}

	for _, item := range p.Types {
		typeID, err := resourceID(item.Type.URL)
		if err != nil {
			return err
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO types (name, pokeapi_id)
			VALUES ($1, $2)
			ON CONFLICT (name) DO UPDATE
			SET pokeapi_id = EXCLUDED.pokeapi_id
		`, item.Type.Name, typeID)
		if err != nil {
			return err
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO pokemon_types (pokemon_id, type_name, slot)
			VALUES ($1, $2, $3)
		`, p.ID, item.Type.Name, item.Slot)
		if err != nil {
			return err
		}
	}

	if _, err := tx.Exec(ctx,
		`DELETE FROM pokemon_stats WHERE pokemon_id = $1`, p.ID,
	); err != nil {
		return err
	}

	for _, item := range p.Stats {
		_, err := tx.Exec(ctx, `
			INSERT INTO pokemon_stats (pokemon_id, stat_name, base_value)
			VALUES ($1, $2, $3)
		`, p.ID, item.Stat.Name, item.BaseStat)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// ImportPokemon151 imports Pokemon #1-151, including their base data, types and stats.
func ImportPokemon151(ctx context.Context, db *pgxpool.Pool) error {
	for id := 1; id <= 151; id++ {
		var pokemon PokemonResponse
		var species SpeciesResponse

		if err := fetchJSON(
			ctx,
			fmt.Sprintf("%s/pokemon/%d", apiURL, id),
			&pokemon,
		); err != nil {
			return fmt.Errorf("fetch Pokemon %d: %w", id, err)
		}

		if err := fetchJSON(
			ctx,
			fmt.Sprintf("%s/pokemon-species/%d", apiURL, id),
			&species,
		); err != nil {
			return fmt.Errorf("fetch species %d: %w", id, err)
		}

		if err := insertPokemon(ctx, db, pokemon, species); err != nil {
			return fmt.Errorf("save Pokemon %d: %w", id, err)
		}

		if err := insertTypesAndStats(ctx, db, pokemon); err != nil {
			return fmt.Errorf("save types/stats for Pokemon %d: %w", id, err)
		}

		fmt.Printf("[%d/151] Imported %s\n", id, pokemon.Name)
		time.Sleep(100 * time.Millisecond)
	}

	return nil
}
