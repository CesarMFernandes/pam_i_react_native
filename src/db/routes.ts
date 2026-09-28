import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from './index';
import type { Difficulty, Route } from '@/types/models';

type RouteRow = {
  id: number;
  name: string;
  description: string | null;
  difficulty: Difficulty;
  distance_meters: number;
  elevation_gain_meters: number;
  start_latitude: number | null;
  start_longitude: number | null;
  cover_uri: string | null;
  created_at: number;
  last_workout_at: number | null;
  total_workouts: number;
};

function toRoute(row: RouteRow): Route {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    difficulty: row.difficulty,
    distanceMeters: row.distance_meters,
    elevationGainMeters: row.elevation_gain_meters,
    startLatitude: row.start_latitude,
    startLongitude: row.start_longitude,
    coverUri: row.cover_uri,
    createdAt: row.created_at,
    lastWorkoutAt: row.last_workout_at,
    totalWorkouts: row.total_workouts,
  };
}

const SELECT_BASE = `
  SELECT
    r.*,
    (SELECT MAX(w.started_at) FROM workouts w WHERE w.route_id = r.id) AS last_workout_at,
    (SELECT COUNT(*)        FROM workouts w WHERE w.route_id = r.id) AS total_workouts
  FROM routes r
`;

export type NewRoute = {
  name: string;
  description?: string | null;
  difficulty?: Difficulty;
  distanceMeters?: number;
  elevationGainMeters?: number;
  startLatitude?: number | null;
  startLongitude?: number | null;
  coverUri?: string | null;
};

export async function listRoutes(): Promise<Route[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RouteRow>(`${SELECT_BASE} ORDER BY r.created_at DESC`);
  return rows.map(toRoute);
}

export async function getRouteById(id: number): Promise<Route | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RouteRow>(`${SELECT_BASE} WHERE r.id = $id`, { $id: id });
  return row ? toRoute(row) : null;
}

export async function createRoute(input: NewRoute): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO routes
       (name, description, difficulty, distance_meters, elevation_gain_meters,
        start_latitude, start_longitude, cover_uri, created_at)
     VALUES ($name, $description, $difficulty, $distance, $elevation,
             $startLat, $startLng, $cover, $now)`,
    {
      $name: input.name,
      $description: input.description ?? null,
      $difficulty: input.difficulty ?? 'media',
      $distance: input.distanceMeters ?? 0,
      $elevation: input.elevationGainMeters ?? 0,
      $startLat: input.startLatitude ?? null,
      $startLng: input.startLongitude ?? null,
      $cover: input.coverUri ?? null,
      $now: Date.now(),
    },
  );
  return result.lastInsertRowId;
}

export async function updateRoute(id: number, input: NewRoute): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE routes SET
       name = $name,
       description = $description,
       difficulty = $difficulty,
       distance_meters = $distance,
       elevation_gain_meters = $elevation,
       start_latitude = $startLat,
       start_longitude = $startLng,
       cover_uri = $cover
     WHERE id = $id`,
    {
      $id: id,
      $name: input.name,
      $description: input.description ?? null,
      $difficulty: input.difficulty ?? 'media',
      $distance: input.distanceMeters ?? 0,
      $elevation: input.elevationGainMeters ?? 0,
      $startLat: input.startLatitude ?? null,
      $startLng: input.startLongitude ?? null,
      $cover: input.coverUri ?? null,
    },
  );
}

export async function deleteRoute(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM routes WHERE id = $id', { $id: id });
}

export async function countRoutes(): Promise<number> {
  const db: SQLiteDatabase = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM routes');
  return row?.total ?? 0;
}
