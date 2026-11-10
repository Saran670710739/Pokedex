package importer

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TypeResponse struct {
	Name string `json:"name"`

	DamageRelations struct {
		DoubleDamageTo []NamedResource `json:"double_damage_to"`
		HalfDamageTo   []NamedResource `json:"half_damage_to"`
		NoDamageTo     []NamedResource `json:"no_damage_to"`
	} `json:"damage_relations"`
}

// ImportTypeEffectiveness imports the type effectiveness chart.
func ImportTypeEffectiveness(ctx context.Context, db *pgxpool.Pool) error {
	// Get all types stored in Supabase.
	rows, err := db.Query(ctx, `SELECT name FROM types ORDER BY name`)
	if err != nil {
		return fmt.Errorf("query types: %w", err)
	}

	var typeNames []string

	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			rows.Close()
			return fmt.Errorf("scan type: %w", err)
		}
		typeNames = append(typeNames, name)
	}

	if err := rows.Err(); err != nil {
		rows.Close()
		return fmt.Errorf("read types: %w", err)
	}
	rows.Close()

	if len(typeNames) == 0 {
		return fmt.Errorf("no types found in database")
	}

	// Initialize every attack/defense combination to normal damage (1.0).
	effectiveness := make(map[string]map[string]float64)

	for _, attackType := range typeNames {
		effectiveness[attackType] = make(map[string]float64)

		for _, defenseType := range typeNames {
			effectiveness[attackType][defenseType] = 1.0
		}
	}

	// Fetch damage relations for each attacking type.
	for _, attackType := range typeNames {
		fmt.Printf("Importing type effectiveness: %s...\n", attackType)

		var typeData TypeResponse

		url := fmt.Sprintf(
			"https://pokeapi.co/api/v2/type/%s",
			attackType,
		)

		if err := fetchJSON(ctx, url, &typeData); err != nil {
			return fmt.Errorf("fetch type %s: %w", attackType, err)
		}

		for _, target := range typeData.DamageRelations.DoubleDamageTo {
			if _, exists := effectiveness[attackType][target.Name]; exists {
				effectiveness[attackType][target.Name] = 2.0
			}
		}

		for _, target := range typeData.DamageRelations.HalfDamageTo {
			if _, exists := effectiveness[attackType][target.Name]; exists {
				effectiveness[attackType][target.Name] = 0.5
			}
		}

		for _, target := range typeData.DamageRelations.NoDamageTo {
			if _, exists := effectiveness[attackType][target.Name]; exists {
				effectiveness[attackType][target.Name] = 0.0
			}
		}
	}

	// Replace existing chart in a single transaction.
	tx, err := db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `DELETE FROM type_effectiveness`)
	if err != nil {
		return fmt.Errorf("clear old type effectiveness: %w", err)
	}

	total := 0

	for _, attackType := range typeNames {
		for _, defenseType := range typeNames {
			_, err := tx.Exec(ctx, `
				INSERT INTO type_effectiveness
					(attack_type, defense_type, multiplier)
				VALUES ($1, $2, $3)
			`,
				attackType,
				defenseType,
				effectiveness[attackType][defenseType],
			)

			if err != nil {
				return fmt.Errorf(
					"insert effectiveness %s -> %s: %w",
					attackType,
					defenseType,
					err,
				)
			}

			total++
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit type effectiveness: %w", err)
	}

	fmt.Printf("Successfully imported %d type effectiveness combinations\n", total)

	return nil
}
