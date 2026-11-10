package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PokemonHandler struct {
	DB *pgxpool.Pool
}

type PokemonListItem struct {
	ID         int      `json:"id"`
	Name       string   `json:"name"`
	ArtworkURL *string  `json:"artwork_url"`
	Types      []string `json:"types"`
}

type PokemonListResponse struct {
	Data       []PokemonListItem `json:"data"`
	Total      int               `json:"total"`
	Page       int               `json:"page"`
	Limit      int               `json:"limit"`
	TotalPages int               `json:"total_pages"`
}

func (h *PokemonHandler) GetPokemon(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10_000_000_000)
	defer cancel()

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 151 {
		limit = 151
	}

	offset := (page - 1) * limit

	var total int

	err := h.DB.QueryRow(ctx, `
		SELECT COUNT(*) FROM pokemons
	`).Scan(&total)

	if err != nil {
		http.Error(w, `{"error":"Failed to count Pokemon"}`, http.StatusInternalServerError)
		return
	}

	rows, err := h.DB.Query(ctx, `
		SELECT
			p.id,
			p.name,
			p.artwork_url,
			COALESCE(
				ARRAY_AGG(pt.type_name ORDER BY pt.slot)
				FILTER (WHERE pt.type_name IS NOT NULL),
				ARRAY[]::text[]
			) AS types
		FROM pokemons p
		LEFT JOIN pokemon_types pt ON pt.pokemon_id = p.id
		GROUP BY p.id, p.name, p.artwork_url
		ORDER BY p.id
		LIMIT $1 OFFSET $2
	`, limit, offset)

	if err != nil {
		http.Error(w, `{"error":"Failed to get Pokemon"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	pokemonList := make([]PokemonListItem, 0)

	for rows.Next() {
		var pokemon PokemonListItem

		if err := rows.Scan(
			&pokemon.ID,
			&pokemon.Name,
			&pokemon.ArtworkURL,
			&pokemon.Types,
		); err != nil {
			http.Error(w, `{"error":"Failed to read Pokemon"}`, http.StatusInternalServerError)
			return
		}

		pokemonList = append(pokemonList, pokemon)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, `{"error":"Failed to read Pokemon rows"}`, http.StatusInternalServerError)
		return
	}

	totalPages := (total + limit - 1) / limit

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(PokemonListResponse{
		Data:       pokemonList,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}

type PokemonDetail struct {
	ID              int                `json:"id"`
	Name            string             `json:"name"`
	Genus           *string            `json:"genus"`
	Description     *string            `json:"description"`
	Height          float64            `json:"height"`
	Weight          float64            `json:"weight"`
	ArtworkURL      *string            `json:"artwork_url"`
	ShinyArtworkURL *string            `json:"shiny_artwork_url"`
	Types           []string           `json:"types"`
	Stats           []PokemonStat      `json:"stats"`
	Abilities       []PokemonAbility   `json:"abilities"`
	Moves           []PokemonMove      `json:"moves"`
	EggGroups       []string           `json:"egg_groups"`
	Evolutions      []PokemonEvolution `json:"evolutions"`
	Weaknesses      []TypeMatchup      `json:"weaknesses"`
	Resistances     []TypeMatchup      `json:"resistances"`
}

type PokemonStat struct {
	Name  string `json:"name"`
	Value int    `json:"value"`
}

type PokemonAbility struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
	IsHidden    bool    `json:"is_hidden"`
}

type PokemonMove struct {
	Name           string  `json:"name"`
	Type           *string `json:"type"`
	Power          *int    `json:"power"`
	Accuracy       *int    `json:"accuracy"`
	PP             *int    `json:"pp"`
	DamageClass    *string `json:"damage_class"`
	LearnMethod    string  `json:"learn_method"`
	LevelLearnedAt int     `json:"level_learned_at"`
}

type PokemonEvolution struct {
	ID         int     `json:"id"`
	Name       string  `json:"name"`
	ArtworkURL *string `json:"artwork_url"`
	Trigger    *string `json:"trigger"`
	MinLevel   *int    `json:"min_level"`
	ItemName   *string `json:"item_name"`
}

type TypeMatchup struct {
	Type       string  `json:"type"`
	Multiplier float64 `json:"multiplier"`
}

func (h *PokemonHandler) GetPokemonDetail(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id < 1 || id > 151 {
		http.Error(w, `{"error":"Invalid Pokemon ID"}`, http.StatusBadRequest)
		return
	}

	result := PokemonDetail{
		Types:       []string{},
		Stats:       []PokemonStat{},
		Abilities:   []PokemonAbility{},
		Moves:       []PokemonMove{},
		EggGroups:   []string{},
		Evolutions:  []PokemonEvolution{},
		Weaknesses:  []TypeMatchup{},
		Resistances: []TypeMatchup{},
	}

	// 1. ข้อมูลพื้นฐาน
	err = h.DB.QueryRow(ctx, `
		SELECT id, name, genus, description, height, weight,
		       artwork_url, shiny_artwork_url
		FROM pokemons
		WHERE id = $1
	`, id).Scan(
		&result.ID, &result.Name, &result.Genus,
		&result.Description, &result.Height, &result.Weight,
		&result.ArtworkURL, &result.ShinyArtworkURL,
	)

	if err != nil {
		log.Printf("GetPokemonDetail query error (ID %d): %v", id, err)

		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, `{"error":"Pokemon not found"}`, http.StatusNotFound)
			return
		}

		http.Error(w, `{"error":"Database query failed"}`, http.StatusInternalServerError)
		return
	}

	// 2. Types
	rows, err := h.DB.Query(ctx, `
		SELECT type_name FROM pokemon_types
		WHERE pokemon_id = $1 ORDER BY slot
	`, id)
	if err != nil {
		http.Error(w, `{"error":"Failed to get types"}`, 500)
		return
	}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			rows.Close()
			http.Error(w, `{"error":"Failed to read types"}`, 500)
			return
		}
		result.Types = append(result.Types, name)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		http.Error(w, `{"error":"Failed to read types"}`, 500)
		return
	}
	rows.Close()

	// 3. Base Stats
	rows, err = h.DB.Query(ctx, `
		SELECT stat_name, base_value
		FROM pokemon_stats
		WHERE pokemon_id = $1
		ORDER BY CASE stat_name
    WHEN 'hp' THEN 1
    WHEN 'attack' THEN 2
    WHEN 'defense' THEN 3
    WHEN 'special-attack' THEN 4
    WHEN 'special-defense' THEN 5
    WHEN 'speed' THEN 6
    ELSE 7
END
	`, id)
	if err != nil {
		http.Error(w, `{"error":"Failed to get stats"}`, 500)
		return
	}
	for rows.Next() {
		var item PokemonStat
		if err := rows.Scan(&item.Name, &item.Value); err != nil {
			rows.Close()
			http.Error(w, `{"error":"Failed to read stats"}`, 500)
			return
		}
		result.Stats = append(result.Stats, item)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		http.Error(w, `{"error":"Failed to read stats"}`, 500)
		return
	}
	rows.Close()

	// 4. Abilities
	rows, err = h.DB.Query(ctx, `
		SELECT a.name, a.description, pa.is_hidden
		FROM pokemon_abilities pa
		JOIN abilities a ON a.id = pa.ability_id
		WHERE pa.pokemon_id = $1
		ORDER BY pa.slot
	`, id)
	if err != nil {
		http.Error(w, `{"error":"Failed to get abilities"}`, 500)
		return
	}
	for rows.Next() {
		var item PokemonAbility
		if err := rows.Scan(&item.Name, &item.Description, &item.IsHidden); err != nil {
			rows.Close()
			http.Error(w, `{"error":"Failed to read abilities"}`, 500)
			return
		}
		result.Abilities = append(result.Abilities, item)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		http.Error(w, `{"error":"Failed to read abilities"}`, 500)
		return
	}
	rows.Close()

	// 5. Moves
	rows, err = h.DB.Query(ctx, `
		SELECT m.name, m.move_type, m.power, m.accuracy,
		       m.pp, m.damage_class, pm.learn_method, pm.level_learned_at
		FROM pokemon_moves pm
		JOIN moves m ON m.id = pm.move_id
		WHERE pm.pokemon_id = $1
		ORDER BY pm.level_learned_at, m.name
	`, id)
	if err != nil {
		http.Error(w, `{"error":"Failed to get moves"}`, 500)
		return
	}
	for rows.Next() {
		var item PokemonMove
		if err := rows.Scan(
			&item.Name, &item.Type, &item.Power, &item.Accuracy,
			&item.PP, &item.DamageClass, &item.LearnMethod,
			&item.LevelLearnedAt,
		); err != nil {
			rows.Close()
			http.Error(w, `{"error":"Failed to read moves"}`, 500)
			return
		}
		result.Moves = append(result.Moves, item)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		http.Error(w, `{"error":"Failed to read moves"}`, 500)
		return
	}
	rows.Close()

	// 6. Egg Groups
	rows, err = h.DB.Query(ctx, `
		SELECT egg_group FROM pokemon_egg_groups
		WHERE pokemon_id = $1
		ORDER BY egg_group
	`, id)
	if err != nil {
		http.Error(w, `{"error":"Failed to get egg groups"}`, 500)
		return
	}
	for rows.Next() {
		var group string
		if err := rows.Scan(&group); err != nil {
			rows.Close()
			http.Error(w, `{"error":"Failed to read egg groups"}`, 500)
			return
		}
		result.EggGroups = append(result.EggGroups, group)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		http.Error(w, `{"error":"Failed to read egg groups"}`, 500)
		return
	}
	rows.Close()

	// 7. Evolution
	rows, err = h.DB.Query(ctx, `
		SELECT p.id, p.name, p.artwork_url,
		       e.trigger_name, e.min_level, e.item_name
		FROM pokemon_evolutions e
		JOIN pokemons p ON p.id = e.to_pokemon_id
		WHERE e.from_pokemon_id = $1
		ORDER BY p.id
	`, id)
	if err != nil {
		http.Error(w, `{"error":"Failed to get evolutions"}`, 500)
		return
	}
	for rows.Next() {
		var item PokemonEvolution
		if err := rows.Scan(
			&item.ID, &item.Name, &item.ArtworkURL,
			&item.Trigger, &item.MinLevel, &item.ItemName,
		); err != nil {
			rows.Close()
			http.Error(w, `{"error":"Failed to read evolutions"}`, 500)
			return
		}
		result.Evolutions = append(result.Evolutions, item)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		http.Error(w, `{"error":"Failed to read evolutions"}`, 500)
		return
	}
	rows.Close()

	// 8. Weaknesses และ Resistances
	rows, err = h.DB.Query(ctx, `
		SELECT
    te.attack_type,
    CASE
        WHEN BOOL_OR(te.multiplier = 0) THEN 0
        ELSE EXP(SUM(LN(te.multiplier)))
    END AS multiplier
		FROM type_effectiveness te
		JOIN pokemon_types pt ON pt.type_name = te.defense_type
		WHERE pt.pokemon_id = $1
		GROUP BY te.attack_type
		ORDER BY te.attack_type
	`, id)
	if err != nil {
		http.Error(w, `{"error":"Failed to get type matchups"}`, 500)
		return
	}

	for rows.Next() {
		var item TypeMatchup
		if err := rows.Scan(&item.Type, &item.Multiplier); err != nil {
			rows.Close()
			http.Error(w, `{"error":"Failed to read type matchups"}`, 500)
			return
		}

		if item.Multiplier > 1 {
			result.Weaknesses = append(result.Weaknesses, item)
		} else if item.Multiplier < 1 {
			result.Resistances = append(result.Resistances, item)
		}
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		http.Error(w, `{"error":"Failed to read type matchups"}`, 500)
		return
	}
	rows.Close()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
