package handler

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FavoriteHandler struct {
	DB *pgxpool.Pool
}

type FavoritePokemon struct {
	ID         int       `json:"id"`
	Name       string    `json:"name"`
	ArtworkURL *string   `json:"artwork_url"`
	Types      []string  `json:"types"`
	CreatedAt  time.Time `json:"created_at"`
}

// POST /api/favorites/{pokemon_id}
func (h *FavoriteHandler) AddFavorite(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(authUserIDKey).(int64)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	pokemonID, err := strconv.Atoi(r.PathValue("pokemon_id"))
	if err != nil || pokemonID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid Pokemon ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	_, err = h.DB.Exec(ctx, `
		INSERT INTO favorites (user_id, pokemon_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, pokemon_id) DO NOTHING
	`, userID, pokemonID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not add favorite",
		})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message":    "Pokemon added to favorites",
		"pokemon_id": pokemonID,
	})
}

// DELETE /api/favorites/{pokemon_id}
func (h *FavoriteHandler) RemoveFavorite(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(authUserIDKey).(int64)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	pokemonID, err := strconv.Atoi(r.PathValue("pokemon_id"))
	if err != nil || pokemonID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid Pokemon ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	tag, err := h.DB.Exec(ctx, `
		DELETE FROM favorites
		WHERE user_id = $1 AND pokemon_id = $2
	`, userID, pokemonID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not remove favorite",
		})
		return
	}

	if tag.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Favorite not found",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Pokemon removed from favorites",
	})
}

// GET /api/favorites
func (h *FavoriteHandler) GetFavorites(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(authUserIDKey).(int64)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	rows, err := h.DB.Query(ctx, `
		SELECT
			p.id,
			p.name,
			p.artwork_url,
			COALESCE(
				ARRAY_AGG(pt.type_name ORDER BY pt.slot)
				FILTER (WHERE pt.type_name IS NOT NULL),
				ARRAY[]::text[]
			) AS types,
			f.created_at
		FROM favorites f
		JOIN pokemons p ON p.id = f.pokemon_id
		LEFT JOIN pokemon_types pt ON pt.pokemon_id = p.id
		WHERE f.user_id = $1
		GROUP BY p.id, p.name, p.artwork_url, f.created_at
		ORDER BY f.created_at DESC
	`, userID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not get favorites",
		})
		return
	}
	defer rows.Close()

	favorites := make([]FavoritePokemon, 0)

	for rows.Next() {
		var favorite FavoritePokemon

		if err := rows.Scan(
			&favorite.ID,
			&favorite.Name,
			&favorite.ArtworkURL,
			&favorite.Types,
			&favorite.CreatedAt,
		); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"error": "Could not read favorites",
			})
			return
		}

		favorites = append(favorites, favorite)
	}

	if err := rows.Err(); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not read favorites",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"data":  favorites,
		"total": len(favorites),
	})
}

// GET /api/favorites/check/{pokemon_id}
func (h *FavoriteHandler) CheckFavorite(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(authUserIDKey).(int64)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	pokemonID, err := strconv.Atoi(r.PathValue("pokemon_id"))
	if err != nil || pokemonID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid Pokemon ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var exists bool

	err = h.DB.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM favorites
			WHERE user_id = $1 AND pokemon_id = $2
		)
	`, userID, pokemonID).Scan(&exists)

	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not check favorite",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"pokemon_id":  pokemonID,
		"is_favorite": exists,
	})
}
