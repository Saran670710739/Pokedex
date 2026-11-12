package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminHandler struct {
	DB *pgxpool.Pool
}

type AdminUser struct {
	ID     int64  `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	Status string `json:"status"`
}

// ตรวจสอบสิทธิ์ Admin จากฐานข้อมูลทุกครั้ง
func (h *AuthHandler) RequireAdmin(next http.Handler) http.Handler {
	return h.RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(authUserIDKey).(int64)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "Unauthorized",
			})
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		var role, status string

		err := h.DB.QueryRow(ctx, `
			SELECT role, status
			FROM users
			WHERE id = $1
		`, userID).Scan(&role, &status)

		if err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "User not found",
			})
			return
		}

		if status != "active" {
			writeJSON(w, http.StatusForbidden, map[string]string{
				"error": "Account is not active",
			})
			return
		}

		if role != "admin" {
			writeJSON(w, http.StatusForbidden, map[string]string{
				"error": "Admin access required",
			})
			return
		}

		next.ServeHTTP(w, r)
	}))
}

// GET /api/admin/summary
func (h *AdminHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var totalUsers, activeUsers, totalAdmins int

	err := h.DB.QueryRow(ctx, `
		SELECT
			COUNT(*)::int,
			COUNT(*) FILTER (WHERE status = 'active')::int,
			COUNT(*) FILTER (WHERE role = 'admin')::int
		FROM users
	`).Scan(&totalUsers, &activeUsers, &totalAdmins)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not load admin summary",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"data": map[string]int{
			"totalUsers":  totalUsers,
			"activeUsers": activeUsers,
			"totalAdmins": totalAdmins,
		},
	})
}

// GET /api/admin/users
func (h *AdminHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	rows, err := h.DB.Query(ctx, `
		SELECT id, name, email, role, status
		FROM users
		ORDER BY id DESC
	`)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not load users",
		})
		return
	}
	defer rows.Close()

	users := make([]AdminUser, 0)

	for rows.Next() {
		var user AdminUser

		if err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Role,
			&user.Status,
		); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"error": "Could not read users",
			})
			return
		}

		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not read users",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"users": users,
		"total": len(users),
	})
}

// PUT /api/admin/users/{id}
func (h *AdminHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid user ID",
		})
		return
	}

	currentID, ok := r.Context().Value(authUserIDKey).(int64)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	if id == currentID {
		writeJSON(w, http.StatusForbidden, map[string]string{
			"error": "Cannot modify your own account",
		})
		return
	}

	var req struct {
		Role   string `json:"role"`
		Status string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid JSON",
		})
		return
	}

	if req.Role != "member" && req.Role != "admin" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid role",
		})
		return
	}

	if req.Status != "active" && req.Status != "disabled" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid status",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var user AdminUser

	err = h.DB.QueryRow(ctx, `
        UPDATE users
        SET role = $1, status = $2
        WHERE id = $3
        RETURNING id, name, email, role, status
    `, req.Role, req.Status, id).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Role,
		&user.Status,
	)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not update user",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "User updated successfully",
		"user":    user,
	})
}
