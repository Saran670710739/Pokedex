package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ReviewHandler struct {
	DB *pgxpool.Pool
}

type Review struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	PokemonID int       `json:"pokemon_id"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ReviewRequest struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}

// POST /api/pokemon/{pokemon_id}/reviews
func (h *ReviewHandler) AddReview(w http.ResponseWriter, r *http.Request) {
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

	var req ReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	req.Comment = strings.TrimSpace(req.Comment)

	if req.Rating < 1 || req.Rating > 5 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Rating must be between 1 and 5",
		})
		return
	}

	if req.Comment == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Comment cannot be empty",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	tx, err := h.DB.Begin(ctx)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not start transaction",
		})
		return
	}
	defer tx.Rollback(ctx)

	// Lock the user and Pokemon pair to prevent duplicate reviews.
	lockKey := strconv.FormatInt(userID, 10) + ":" + strconv.Itoa(pokemonID)

	_, err = tx.Exec(ctx, `
    SELECT pg_advisory_xact_lock(
        hashtextextended($1, 0)
    )
`, lockKey)

	if err != nil {
		log.Printf("AddReview Advisory Lock Error: %v", err)

		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not process review",
		})
		return
	}

	// Check whether Pokemon exists.
	var pokemonExists bool
	err = tx.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM pokemons WHERE id = $1
		)
	`, pokemonID).Scan(&pokemonExists)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not check Pokemon",
		})
		return
	}

	if !pokemonExists {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Pokemon not found",
		})
		return
	}

	// Prevent the same user from reviewing the same Pokemon twice.
	var existingID int64
	err = tx.QueryRow(ctx, `
		SELECT id
		FROM reviews
		WHERE user_id = $1 AND pokemon_id = $2
	`, userID, pokemonID).Scan(&existingID)

	if err == nil {
		writeJSON(w, http.StatusConflict, map[string]string{
			"error": "You have already reviewed this Pokemon",
		})
		return
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not check existing review",
		})
		return
	}

	var review Review

	err = tx.QueryRow(ctx, `
		INSERT INTO reviews (
			user_id,
			pokemon_id,
			rating,
			comment,
			status
		)
		VALUES ($1, $2, $3, $4, 'published')
		RETURNING
			id,
			user_id,
			pokemon_id,
			rating,
			comment,
			status,
			created_at,
			updated_at
	`, userID, pokemonID, req.Rating, req.Comment).Scan(
		&review.ID,
		&review.UserID,
		&review.PokemonID,
		&review.Rating,
		&review.Comment,
		&review.Status,
		&review.CreatedAt,
		&review.UpdatedAt,
	)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not create review",
		})
		return
	}

	if err := tx.Commit(ctx); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not save review",
		})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Review created successfully",
		"data":    review,
	})
}

// GET /api/pokemon/{pokemon_id}/reviews
func (h *ReviewHandler) GetPokemonReviews(w http.ResponseWriter, r *http.Request) {
	pokemonID, err := strconv.Atoi(r.PathValue("pokemon_id"))
	if err != nil || pokemonID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid Pokemon ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	rows, err := h.DB.Query(ctx, `
		SELECT
			id,
			user_id,
			pokemon_id,
			rating,
			comment,
			status,
			created_at,
			updated_at
		FROM reviews
		WHERE pokemon_id = $1
		AND status = 'published'
		ORDER BY created_at DESC
	`, pokemonID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not get reviews",
		})
		return
	}
	defer rows.Close()

	reviews := make([]Review, 0)

	for rows.Next() {
		var review Review

		if err := rows.Scan(
			&review.ID,
			&review.UserID,
			&review.PokemonID,
			&review.Rating,
			&review.Comment,
			&review.Status,
			&review.CreatedAt,
			&review.UpdatedAt,
		); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"error": "Could not read reviews",
			})
			return
		}

		reviews = append(reviews, review)
	}

	if err := rows.Err(); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not read reviews",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"data":  reviews,
		"total": len(reviews),
	})
}

// PUT /api/reviews/{id}
func (h *ReviewHandler) UpdateReview(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(authUserIDKey).(int64)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	reviewID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || reviewID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid Review ID",
		})
		return
	}

	var req ReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	req.Comment = strings.TrimSpace(req.Comment)

	if req.Rating < 1 || req.Rating > 5 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Rating must be between 1 and 5",
		})
		return
	}

	if req.Comment == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Comment cannot be empty",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var review Review

	err = h.DB.QueryRow(ctx, `
		UPDATE reviews
		SET
			rating = $1,
			comment = $2,
			updated_at = NOW()
		WHERE id = $3 AND user_id = $4
		RETURNING
			id,
			user_id,
			pokemon_id,
			rating,
			comment,
			status,
			created_at,
			updated_at
	`, req.Rating, req.Comment, reviewID, userID).Scan(
		&review.ID,
		&review.UserID,
		&review.PokemonID,
		&review.Rating,
		&review.Comment,
		&review.Status,
		&review.CreatedAt,
		&review.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Review not found",
		})
		return
	}

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not update review",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Review updated successfully",
		"data":    review,
	})
}

// DELETE /api/reviews/{id}
func (h *ReviewHandler) DeleteReview(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(authUserIDKey).(int64)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	reviewID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || reviewID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid Review ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	tag, err := h.DB.Exec(ctx, `
		DELETE FROM reviews
		WHERE id = $1 AND user_id = $2
	`, reviewID, userID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not delete review",
		})
		return
	}

	if tag.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Review not found",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Review deleted successfully",
	})
}
