// CUE schema: Application configuration
// Validates the structure of apps/api/.env values

package config

#AppConfig: {
	port:                  int & >=1 & <=65535
	databaseUrl:           string & =~"^postgresql://"
	redisUrl:              string & =~"^redis://"
	jwtSecret:             string & len >= 32
	jwtExpiresIn:          string
	jwtRefreshExpiresIn:   string
	nodeEnv:               "development" | "production" | "test"
}

// Example valid config (used for documentation and testing)
example: #AppConfig & {
	port:                 3000
	databaseUrl:          "postgresql://rbac:secret@localhost:5432/rbac_db"
	redisUrl:             "redis://localhost:6379"
	jwtSecret:            "change-me-in-production-use-at-least-32-chars"
	jwtExpiresIn:         "15m"
	jwtRefreshExpiresIn:  "7d"
	nodeEnv:              "development"
}
