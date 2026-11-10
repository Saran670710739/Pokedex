
package importer

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PokemonResourcesResponse struct {
	Abilities []struct {
		Ability  NamedResource `json:"ability"`
		IsHidden bool          `json:"is_hidden"`
		Slot     int           `json:"slot"`
	} `json:"abilities"`

	Moves []struct {
		Move NamedResource `json:"move"`
		VersionGroupDetails []struct {
			LevelLearnedAt int           `json:"level_learned_at"`
			MoveLearnMethod NamedResource `json:"move_learn_method"`
			VersionGroup    NamedResource `json:"version_group"`
		} `json:"version_group_details"`
	} `json:"moves"`
}

type AbilityResponse struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	EffectEntries []struct {
		Effect   string `json:"effect"`
		Language NamedResource `json:"language"`
	} `json:"effect_entries"`
}

type MoveResponse struct {
	ID          int            `json:"id"`
	Name        string         `json:"name"`
	Power       *int           `json:"power"`
	Accuracy    *int           `json:"accuracy"`
	PP          *int           `json:"pp"`
	Type        NamedResource  `json:"type"`
	DamageClass NamedResource  `json:"damage_class"`
	FlavorTextEntries []struct {
		FlavorText string         `json:"flavor_text"`
		Language   NamedResource  `json:"language"`
	} `json:"flavor_text_entries"`
}

type SpeciesResourcesResponse struct {
	EggGroups []NamedResource `json:"egg_groups"`
}

// ImportPokemonResources imports abilities, moves and egg groups
// for Pokemon #1-151.
func ImportPokemonResources(ctx context.Context, db *pgxpool.Pool) error {
	moveCache := make(map[int]bool)
	abilityCache := make(map[int]bool)

	for pokemonID := 1; pokemonID <= 151; pokemonID++ {
		fmt.Printf("Importing resources for Pokemon #%d...\n", pokemonID)

		var pokemon PokemonResourcesResponse
		url := fmt.Sprintf("https://pokeapi.co/api/v2/pokemon/%d", pokemonID)

		if err := fetchJSON(ctx, url, &pokemon); err != nil {
			return fmt.Errorf("fetch pokemon %d resources: %w", pokemonID, err)
		}

		// Import abilities and their relationships.
		for _, entry := range pokemon.Abilities {
			abilityID, idErr := resourceID(entry.Ability.URL)
if idErr != nil {
    return fmt.Errorf("invalid ability URL: %w", idErr)
}
if abilityID == 0 {
    continue
}

			if !abilityCache[abilityID] {
				var ability AbilityResponse
				abilityURL := entry.Ability.URL

				if err := fetchJSON(ctx, abilityURL, &ability); err != nil {
					return fmt.Errorf("fetch ability %s: %w", entry.Ability.Name, err)
				}

				description := ""
				for _, effect := range ability.EffectEntries {
					if effect.Language.Name == "en" {
						description = effect.Effect
						break
					}
				}

				_, err := db.Exec(ctx, `
					INSERT INTO abilities (id, name, description)
					VALUES ($1, $2, $3)
					ON CONFLICT (id) DO UPDATE SET
						name = EXCLUDED.name,
						description = EXCLUDED.description
				`, ability.ID, ability.Name, description)
				if err != nil {
					return fmt.Errorf("insert ability %s: %w", ability.Name, err)
				}

				abilityCache[abilityID] = true
				time.Sleep(50 * time.Millisecond)
			}

			_, err := db.Exec(ctx, `
				INSERT INTO pokemon_abilities
					(pokemon_id, ability_id, is_hidden, slot)
				VALUES ($1, $2, $3, $4)
				ON CONFLICT (pokemon_id, ability_id) DO UPDATE SET
					is_hidden = EXCLUDED.is_hidden,
					slot = EXCLUDED.slot
			`, pokemonID, abilityID, entry.IsHidden, entry.Slot)
			if err != nil {
				return fmt.Errorf("link ability to pokemon %d: %w", pokemonID, err)
			}
		}

		// Import moves learned in Pokemon Red/Blue.
		for _, entry := range pokemon.Moves {
			moveID, idErr := resourceID(entry.Move.URL)
if idErr != nil {
    return fmt.Errorf("invalid move URL: %w", idErr)
}
if moveID == 0 {
    continue
}

			learnMethods := make([]struct {
				level  int
				method string
				group  string
			}, 0)

			for _, detail := range entry.VersionGroupDetails {
				if detail.VersionGroup.Name != "red-blue" {
					continue
				}

				learnMethods = append(learnMethods, struct {
					level  int
					method string
					group  string
				}{
					level:  detail.LevelLearnedAt,
					method: detail.MoveLearnMethod.Name,
					group:  detail.VersionGroup.Name,
				})
			}

			// Skip moves that are not available in Red/Blue.
			if len(learnMethods) == 0 {
				continue
			}

			if !moveCache[moveID] {
				var move MoveResponse
				if err := fetchJSON(ctx, entry.Move.URL, &move); err != nil {
					return fmt.Errorf("fetch move %s: %w", entry.Move.Name, err)
				}

				// Ensure the move type exists before inserting the move.
				typeID, idErr := resourceID(move.Type.URL)
if idErr != nil {
    return fmt.Errorf("invalid move type URL: %w", idErr)
}
				_, err := db.Exec(ctx, `
					INSERT INTO types (name, pokeapi_id)
					VALUES ($1, $2)
					ON CONFLICT (name) DO NOTHING
				`, move.Type.Name, typeID)
				if err != nil {
					return fmt.Errorf("insert move type %s: %w", move.Type.Name, err)
				}

				description := ""
				for _, flavor := range move.FlavorTextEntries {
					if flavor.Language.Name == "en" {
						description = strings.ReplaceAll(flavor.FlavorText, "\n", " ")
						description = strings.ReplaceAll(description, "\f", " ")
						break
					}
				}

				_, err = db.Exec(ctx, `
					INSERT INTO moves
						(id, name, move_type, power, accuracy, pp, damage_class, description)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
					ON CONFLICT (id) DO UPDATE SET
						name = EXCLUDED.name,
						move_type = EXCLUDED.move_type,
						power = EXCLUDED.power,
						accuracy = EXCLUDED.accuracy,
						pp = EXCLUDED.pp,
						damage_class = EXCLUDED.damage_class,
						description = EXCLUDED.description
				`,
					move.ID,
					move.Name,
					move.Type.Name,
					move.Power,
					move.Accuracy,
					move.PP,
					move.DamageClass.Name,
					description,
				)
				if err != nil {
					return fmt.Errorf("insert move %s: %w", move.Name, err)
				}

				moveCache[moveID] = true
				time.Sleep(50 * time.Millisecond)
			}

			for _, learn := range learnMethods {
				_, err := db.Exec(ctx, `
					INSERT INTO pokemon_moves
						(pokemon_id, move_id, learn_method, level_learned_at, version_group)
					VALUES ($1, $2, $3, $4, $5)
					ON CONFLICT
						(pokemon_id, move_id, learn_method, level_learned_at, version_group)
					DO NOTHING
				`, pokemonID, moveID, learn.method, learn.level, learn.group)
				if err != nil {
					return fmt.Errorf("link move %d to pokemon %d: %w", moveID, pokemonID, err)
				}
			}
		}

		// Import egg groups from Pokemon species.
		var species SpeciesResourcesResponse
		speciesURL := fmt.Sprintf("https://pokeapi.co/api/v2/pokemon-species/%d", pokemonID)

		if err := fetchJSON(ctx, speciesURL, &species); err != nil {
			return fmt.Errorf("fetch species %d egg groups: %w", pokemonID, err)
		}

		for _, group := range species.EggGroups {
			_, err := db.Exec(ctx, `
				INSERT INTO egg_groups (name)
				VALUES ($1)
				ON CONFLICT (name) DO NOTHING
			`, group.Name)
			if err != nil {
				return fmt.Errorf("insert egg group %s: %w", group.Name, err)
			}

			_, err = db.Exec(ctx, `
				INSERT INTO pokemon_egg_groups (pokemon_id, egg_group)
				VALUES ($1, $2)
				ON CONFLICT (pokemon_id, egg_group) DO NOTHING
			`, pokemonID, group.Name)
			if err != nil {
				return fmt.Errorf("link egg group to pokemon %d: %w", pokemonID, err)
			}
		}

		time.Sleep(100 * time.Millisecond)
	}

	fmt.Printf(
		"Imported resources: %d unique moves and %d unique abilities\n",
		len(moveCache),
		len(abilityCache),
	)

	return nil
}
