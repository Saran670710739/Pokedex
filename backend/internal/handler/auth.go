package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB        *pgxpool.Pool
	JWTSecret []byte
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthUser struct {
	ID     int64  `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	Status string `json:"status"`
}

type AuthClaims struct {
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if req.Name == "" || req.Email == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Name, email and password are required",
		})
		return
	}

	if len(req.Name) > 100 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Name must not exceed 100 characters",
		})
		return
	}

	emailRegex := regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)
	if !emailRegex.MatchString(req.Email) || len(req.Email) > 254 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid email address",
		})
		return
	}

	if len(req.Password) < 8 || len(req.Password) > 72 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Password must be between 8 and 72 bytes",
		})
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword(
		[]byte(req.Password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not secure password",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var user AuthUser

	err = h.DB.QueryRow(ctx, `
		INSERT INTO users (name, email, password_hash, role, status)
		VALUES ($1, $2, $3, 'member', 'active')
		RETURNING id, name, email, role, status
	`, req.Name, req.Email, string(passwordHash)).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Role,
		&user.Status,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			writeJSON(w, http.StatusConflict, map[string]string{
				"error": "Email is already registered",
			})
			return
		}

		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not register user",
		})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Registration successful",
		"user":    user,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if req.Email == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Email and password are required",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var user AuthUser
	var passwordHash string

	err := h.DB.QueryRow(ctx, `
		SELECT id, name, email, password_hash, role, status
		FROM users
		WHERE LOWER(email) = $1
	`, req.Email).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&passwordHash,
		&user.Role,
		&user.Status,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Invalid email or password",
		})
		return
	}

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Login failed",
		})
		return
	}

	if user.Status != "active" {
		writeJSON(w, http.StatusForbidden, map[string]string{
			"error": "Account is not active",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword(
		[]byte(passwordHash),
		[]byte(req.Password),
	); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Invalid email or password",
		})
		return
	}

	tokenString, err := h.createToken(user)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not create access token",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":      "Login successful",
		"access_token": tokenString,
		"token_type":   "Bearer",
		"expires_in":   86400,
		"user":         user,
	})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(authUserIDKey).(int64)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var user AuthUser

	err := h.DB.QueryRow(ctx, `
		SELECT id, name, email, role, status
		FROM users
		WHERE id = $1
	`, userID).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Role,
		&user.Status,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "User not found",
		})
		return
	}

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Could not get user",
		})
		return
	}

	if user.Status != "active" {
		writeJSON(w, http.StatusForbidden, map[string]string{
			"error": "Account is not active",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"user": user,
	})
}

func (h *AuthHandler) createToken(user AuthUser) (string, error) {
	claims := AuthClaims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "user",
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(h.JWTSecret)
}

func (h *AuthHandler) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		parts := strings.SplitN(authHeader, " ", 2)

		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "Missing or invalid authorization header",
			})
			return
		}

		claims := &AuthClaims{}

		token, err := jwt.ParseWithClaims(
			parts[1],
			claims,
			func(token *jwt.Token) (interface{}, error) {
				if token.Method != jwt.SigningMethodHS256 {
					return nil, errors.New("unexpected signing method")
				}
				return h.JWTSecret, nil
			},
		)

		if err != nil || !token.Valid || claims.UserID <= 0 {
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "Invalid or expired token",
			})
			return
		}

		ctx := context.WithValue(r.Context(), authUserIDKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

type authContextKey string

const authUserIDKey authContextKey = "auth_user_id"

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func (h *AuthHandler) ValidateConfig() error {
	if len(h.JWTSecret) < 32 {
		return errors.New("JWT_SECRET must contain at least 32 bytes")
	}
	return nil
}

func NewAuthHandler(db *pgxpool.Pool) (*AuthHandler, error) {
	secret := os.Getenv("JWT_SECRET")
	if len(secret) < 32 {
		return nil, errors.New("JWT_SECRET is missing or too short (minimum 32 characters)")
	}

	return &AuthHandler{
		DB:        db,
		JWTSecret: []byte(secret),
	}, nil
}
