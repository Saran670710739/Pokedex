
package importer

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type SpeciesEvolutionResponse struct {
	EvolutionChain struct {
		URL string `json:"url"`
	} `json:"evolution_chain"`
}

type EvolutionChainResponse struct {
	Chain EvolutionNode `json:"chain"`
}

type EvolutionNode struct {
	Species          NamedResource     `json:"species"`
	EvolutionDetails []EvolutionDetail `json:"evolution_details"`
	EvolvesTo        []EvolutionNode   `json:"evolves_to"`
}

type EvolutionDetail struct {
	Trigger       NamedResource  `json:"trigger"`
	MinLevel      *int           `json:"min_level"`
	Item          *NamedResource `json:"item"`
	MinHappiness  *int           `json:"min_happiness"`
	TimeOfDay     string         `json:"time_of_day"`
	KnownMove     *NamedResource `json:"known_move"`
	KnownMoveType *NamedResource `json:"known_move_type"`
	Location      *NamedResource `json:"location"`
	PartySpecies  *NamedResource `json:"party_species"`
	PartyType     *NamedResource `json:"party_type"`
	RelativePhysicalStats *int   `json:"relative_physical_stats"`
	NeedsOverworldRain bool       `json:"needs_overworld_rain"`
	TurnUpsideDown bool           `json:"turn_upside_down"`
}

func evolutionResourceID(url string) (int, error) {
	parts := strings.Split(strings.TrimRight(url, "/"), "/")
	if len(parts) == 0 {
		return 0, fmt.Errorf("empty resource URL")
	}

	id, err := strconv.Atoi(parts[len(parts)-1])
	if err != nil {
		return 0, fmt.Errorf("invalid resource URL %q: %w", url, err)
	}

	return id, nil
}

func importEvolutionNode(
	ctx context.Context,
	db *pgxpool.Pool,
	node EvolutionNode,
) error {
	fromID, err := evolutionResourceID(node.Species.URL)
	if err != nil {
		return err
	}

	for _, next := range node.EvolvesTo {
		toID, err := evolutionResourceID(next.Species.URL)
		if err != nil {
			return err
		}

		// Keep only evolutions where both Pokemon are in Gen 1.
		if fromID >= 1 && fromID <= 151 && toID >= 1 && toID <= 151 {
			detailsList := nodeDetails(next.EvolutionDetails)

			for _, detail := range detailsList {
				conditionsJSON, err := json.Marshal(detail.conditions)
				if err != nil {
					return fmt.Errorf("encode evolution conditions: %w", err)
				}

				_, err = db.Exec(ctx, `
					INSERT INTO pokemon_evolutions
						(from_pokemon_id, to_pokemon_id, trigger_name,
						 min_level, item_name, conditions)
					VALUES ($1, $2, $3, $4, $5, $6::jsonb)
					ON CONFLICT (from_pokemon_id, to_pokemon_id)
					DO UPDATE SET
						trigger_name = EXCLUDED.trigger_name,
						min_level = EXCLUDED.min_level,
						item_name = EXCLUDED.item_name,
						conditions = EXCLUDED.conditions
				`,
					fromID,
					toID,
					detail.trigger,
					detail.minLevel,
					detail.itemName,
					string(conditionsJSON),
				)
				if err != nil {
					return fmt.Errorf(
						"insert evolution %d -> %d: %w",
						fromID, toID, err,
					)
				}
			}
		}

		if err := importEvolutionNode(ctx, db, next); err != nil {
			return err
		}
	}

	return nil
}

type evolutionInsertDetail struct {
	trigger    string
	minLevel   *int
	itemName   *string
	conditions map[string]any
}

func nodeDetails(details []EvolutionDetail) []evolutionInsertDetail {
	result := make([]evolutionInsertDetail, 0, len(details))

	for _, detail := range details {
		var itemName *string
		if detail.Item != nil {
			itemName = &detail.Item.Name
		}

		conditions := map[string]any{
			"time_of_day":            detail.TimeOfDay,
			"needs_overworld_rain":   detail.NeedsOverworldRain,
			"turn_upside_down":       detail.TurnUpsideDown,
		}

		if detail.MinHappiness != nil {
			conditions["min_happiness"] = *detail.MinHappiness
		}
		if detail.KnownMove != nil {
			conditions["known_move"] = detail.KnownMove.Name
		}
		if detail.KnownMoveType != nil {
			conditions["known_move_type"] = detail.KnownMoveType.Name
		}
		if detail.Location != nil {
			conditions["location"] = detail.Location.Name
		}
		if detail.PartySpecies != nil {
			conditions["party_species"] = detail.PartySpecies.Name
		}
		if detail.PartyType != nil {
			conditions["party_type"] = detail.PartyType.Name
		}
		if detail.RelativePhysicalStats != nil {
			conditions["relative_physical_stats"] = *detail.RelativePhysicalStats
		}

		result = append(result, evolutionInsertDetail{
			trigger:    detail.Trigger.Name,
			minLevel:   detail.MinLevel,
			itemName:   itemName,
			conditions: conditions,
		})
	}

	return result
}

// ImportPokemonEvolutions imports evolution relationships for Gen 1.
func ImportPokemonEvolutions(ctx context.Context, db *pgxpool.Pool) error {
	seenChains := make(map[int]bool)

	for pokemonID := 1; pokemonID <= 151; pokemonID++ {
		fmt.Printf("Checking evolution chain for Pokemon #%d...\n", pokemonID)

		var species SpeciesEvolutionResponse
		speciesURL := fmt.Sprintf(
			"https://pokeapi.co/api/v2/pokemon-species/%d",
			pokemonID,
		)

		if err := fetchJSON(ctx, speciesURL, &species); err != nil {
			return fmt.Errorf("fetch species %d: %w", pokemonID, err)
		}

		chainID, err := evolutionResourceID(species.EvolutionChain.URL)
		if err != nil {
			return fmt.Errorf("get evolution chain for Pokemon %d: %w", pokemonID, err)
		}

		if seenChains[chainID] {
			continue
		}
		seenChains[chainID] = true

		var chain EvolutionChainResponse
		chainURL := fmt.Sprintf(
			"https://pokeapi.co/api/v2/evolution-chain/%d",
			chainID,
		)

		if err := fetchJSON(ctx, chainURL, &chain); err != nil {
			return fmt.Errorf("fetch evolution chain %d: %w", chainID, err)
		}

		if err := importEvolutionNode(ctx, db, chain.Chain); err != nil {
			return fmt.Errorf("import evolution chain %d: %w", chainID, err)
		}

		time.Sleep(100 * time.Millisecond)
	}

	fmt.Printf("Imported %d unique evolution chains\n", len(seenChains))
	return nil
}
