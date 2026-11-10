package database

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(ctx context.Context) (*pgxpool.Pool, error) {
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	sslMode := os.Getenv("DB_SSLMODE")

	// ตรวจสอบว่ากรอกค่าครบ
	if host == "" || port == "" || user == "" ||
		password == "" || dbName == "" || sslMode == "" {
		return nil, fmt.Errorf("database environment variables are incomplete")
	}

	// สร้าง Connection URL
	u := url.URL{
		Scheme: "postgres",
		Host:   net.JoinHostPort(host, port),
		Path:   dbName,
		User:   url.UserPassword(user, password),
	}

	query := u.Query()
	query.Set("sslmode", sslMode)
	u.RawQuery = query.Encode()

	// เชื่อมต่อฐานข้อมูล
	pool, err := pgxpool.New(ctx, u.String())
	if err != nil {
		return nil, fmt.Errorf("failed to create database pool: %w", err)
	}

	// ทดสอบการเชื่อมต่อจริง
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return pool, nil
}