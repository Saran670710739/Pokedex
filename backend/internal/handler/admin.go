package handler

import (
	"context"
	"net/http"
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
