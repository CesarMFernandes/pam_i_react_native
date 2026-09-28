import * as SQLite from 'expo-sqlite';

import { DATABASE_NAME, MIGRATIONS, SCHEMA_VERSION } from './schema';

let database: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= SCHEMA_VERSION) {
    return;
  }

  for (let version = currentVersion; version < SCHEMA_VERSION; version += 1) {
    await db.execAsync(MIGRATIONS[version]);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

/**
 * Abre (uma única vez) e migra o banco. Todas as repositories recebem
 * o resultado desta promessa, garantindo que o schema já esteja pronto.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) {
    database = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await migrate(db);
      return db;
    });
  }

  return database;
}

/** Usado apenas pelos testes e pelo botão "apagar dados" das telas de ajuste. */
export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM track_points;
    DELETE FROM photos;
    DELETE FROM workouts;
    DELETE FROM routes;
    DELETE FROM settings;
    DELETE FROM sqlite_sequence;
  `);
}
