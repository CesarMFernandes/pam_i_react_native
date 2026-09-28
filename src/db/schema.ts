/**
 * Definição do schema do banco.
 *
 * Cada entrada de MIGRATIONS é uma versão do banco. Para evoluir o schema:
 *  1. incremente SCHEMA_VERSION
 *  2. adicione uma nova entrada no array
 * A migração roda uma única vez, controlada por `PRAGMA user_version`.
 */
export const DATABASE_NAME = 'rota-rn.db';

export const SCHEMA_VERSION = 1;

export const MIGRATIONS: string[] = [
  // v1 — schema inicial
  `
  CREATE TABLE IF NOT EXISTS routes (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    name                 TEXT    NOT NULL,
    description          TEXT,
    difficulty           TEXT    NOT NULL DEFAULT 'media',
    distance_meters      REAL    NOT NULL DEFAULT 0,
    elevation_gain_meters REAL   NOT NULL DEFAULT 0,
    start_latitude       REAL,
    start_longitude      REAL,
    cover_uri            TEXT,
    created_at           INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id           INTEGER REFERENCES routes(id) ON DELETE SET NULL,
    name               TEXT    NOT NULL,
    status             TEXT    NOT NULL DEFAULT 'ativo',
    started_at         INTEGER NOT NULL,
    ended_at           INTEGER,
    duration_seconds   INTEGER NOT NULL DEFAULT 0,
    distance_meters    REAL    NOT NULL DEFAULT 0,
    avg_speed_mps      REAL    NOT NULL DEFAULT 0,
    max_speed_mps      REAL    NOT NULL DEFAULT 0,
    steps              INTEGER NOT NULL DEFAULT 0,
    notes              TEXT,
    shared_contact_id  TEXT,
    shared_contact_name TEXT
  );

  CREATE TABLE IF NOT EXISTS track_points (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id  INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    seq         INTEGER NOT NULL,
    latitude    REAL    NOT NULL,
    longitude   REAL    NOT NULL,
    altitude    REAL,
    accuracy    REAL,
    speed       REAL,
    heading     REAL,
    recorded_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_track_points_workout
    ON track_points (workout_id, seq);

  CREATE TABLE IF NOT EXISTS photos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
    route_id   INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    uri        TEXT    NOT NULL,
    kind       TEXT    NOT NULL DEFAULT 'galeria',
    caption    TEXT,
    latitude   REAL,
    longitude  REAL,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_photos_workout ON photos (workout_id);
  CREATE INDEX IF NOT EXISTS idx_photos_route   ON photos (route_id);

  CREATE TABLE IF NOT EXISTS waypoints (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id  INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    latitude    REAL    NOT NULL,
    longitude   REAL    NOT NULL,
    label       TEXT,
    created_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_waypoints_workout ON waypoints (workout_id);

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];
