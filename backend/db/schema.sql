
-- Pokedex database schema
-- Scope: Generation I Pokemon (National Dex #1-151)
-- PostgreSQL / Supabase

BEGIN;

-- 1. Pokemon master data
CREATE TABLE IF NOT EXISTS pokemons (
    id              INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 151),
    name            VARCHAR(100) NOT NULL UNIQUE,
    genus           VARCHAR(150),
    description     TEXT,
    height          NUMERIC(5,1),
    weight          NUMERIC(6,1),
    artwork_url     TEXT,
    shiny_artwork_url TEXT,
    front_image_url TEXT,
    capture_rate    SMALLINT,
    hatch_counter   SMALLINT,
    gender_rate     SMALLINT CHECK (gender_rate BETWEEN -1 AND 8),
    is_legendary    BOOLEAN NOT NULL DEFAULT FALSE,
    is_mythical     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Pokemon types (e.g. fire, water, grass)
CREATE TABLE IF NOT EXISTS types (
    name        VARCHAR(30) PRIMARY KEY,
    pokeapi_id  INTEGER UNIQUE
);

CREATE TABLE IF NOT EXISTS pokemon_types (
    pokemon_id  INTEGER NOT NULL REFERENCES pokemons(id) ON DELETE CASCADE,
    type_name   VARCHAR(30) NOT NULL REFERENCES types(name),
    slot        SMALLINT NOT NULL CHECK (slot IN (1, 2)),
    PRIMARY KEY (pokemon_id, slot),
    UNIQUE (pokemon_id, type_name)
);

-- 3. Base stats
CREATE TABLE IF NOT EXISTS pokemon_stats (
    pokemon_id  INTEGER NOT NULL REFERENCES pokemons(id) ON DELETE CASCADE,
    stat_name   VARCHAR(30) NOT NULL CHECK (
        stat_name IN (
            'hp', 'attack', 'defense',
            'special-attack', 'special-defense', 'speed'
        )
    ),
    base_value  SMALLINT NOT NULL CHECK (base_value >= 0),
    PRIMARY KEY (pokemon_id, stat_name)
);

-- 4. Abilities
CREATE TABLE IF NOT EXISTS abilities (
    id          INTEGER PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS pokemon_abilities (
    pokemon_id  INTEGER NOT NULL REFERENCES pokemons(id) ON DELETE CASCADE,
    ability_id  INTEGER NOT NULL REFERENCES abilities(id),
    is_hidden   BOOLEAN NOT NULL DEFAULT FALSE,
    slot        SMALLINT NOT NULL,
    PRIMARY KEY (pokemon_id, ability_id)
);

-- 5. Moves
CREATE TABLE IF NOT EXISTS moves (
    id          INTEGER PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    move_type   VARCHAR(30) REFERENCES types(name),
    power       SMALLINT,
    accuracy    SMALLINT,
    pp          SMALLINT,
    damage_class VARCHAR(30),
    description TEXT
);

CREATE TABLE IF NOT EXISTS pokemon_moves (
    pokemon_id       INTEGER NOT NULL REFERENCES pokemons(id) ON DELETE CASCADE,
    move_id          INTEGER NOT NULL REFERENCES moves(id),
    learn_method     VARCHAR(50) NOT NULL,
    level_learned_at SMALLINT NOT NULL DEFAULT 0,
    version_group    VARCHAR(50) NOT NULL DEFAULT 'red-blue',
    PRIMARY KEY (
        pokemon_id, move_id, learn_method,
        level_learned_at, version_group
    )
);

-- 6. Evolution relationships and conditions
CREATE TABLE IF NOT EXISTS pokemon_evolutions (
    from_pokemon_id INTEGER NOT NULL REFERENCES pokemons(id) ON DELETE CASCADE,
    to_pokemon_id   INTEGER NOT NULL REFERENCES pokemons(id) ON DELETE CASCADE,
    trigger_name    VARCHAR(50),
    min_level       SMALLINT,
    item_name       VARCHAR(100),
    conditions      JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (from_pokemon_id, to_pokemon_id),
    CHECK (from_pokemon_id <> to_pokemon_id)
);

-- 7. Breeding / egg groups
CREATE TABLE IF NOT EXISTS egg_groups (
    name VARCHAR(50) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS pokemon_egg_groups (
    pokemon_id INTEGER NOT NULL REFERENCES pokemons(id) ON DELETE CASCADE,
    egg_group  VARCHAR(50) NOT NULL REFERENCES egg_groups(name),
    PRIMARY KEY (pokemon_id, egg_group)
);

-- 8. Type effectiveness
-- multiplier: 0, 0.25, 0.5, 1, 2, 4, etc.
CREATE TABLE IF NOT EXISTS type_effectiveness (
    attack_type   VARCHAR(30) NOT NULL REFERENCES types(name),
    defense_type  VARCHAR(30) NOT NULL REFERENCES types(name),
    multiplier    NUMERIC(4,2) NOT NULL CHECK (multiplier >= 0),
    PRIMARY KEY (attack_type, defense_type)
);

-- 9. Application users (Go + JWT + bcrypt)
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'member'
                  CHECK (role IN ('member', 'admin')),
    status        VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'disabled')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Member wishlist / favorites
CREATE TABLE IF NOT EXISTS favorites (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pokemon_id  INTEGER NOT NULL REFERENCES pokemons(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, pokemon_id)
);

-- 11. Community reviews
CREATE TABLE IF NOT EXISTS reviews (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pokemon_id  INTEGER NOT NULL REFERENCES pokemons(id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT NOT NULL CHECK (
        char_length(trim(comment)) BETWEEN 1 AND 2000
    ),
    status      VARCHAR(20) NOT NULL DEFAULT 'published'
                CHECK (status IN ('published', 'hidden')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pokemons_name
    ON pokemons (name);

CREATE INDEX IF NOT EXISTS idx_pokemon_types_type
    ON pokemon_types (type_name);

CREATE INDEX IF NOT EXISTS idx_pokemon_moves_move
    ON pokemon_moves (move_id);

CREATE INDEX IF NOT EXISTS idx_evolutions_to
    ON pokemon_evolutions (to_pokemon_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user
    ON favorites (user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_pokemon
    ON reviews (pokemon_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_user
    ON reviews (user_id);

CREATE INDEX IF NOT EXISTS idx_users_role
    ON users (role);

COMMIT;
