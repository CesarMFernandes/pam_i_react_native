import { getDatabase } from './index';
import type { PhotoKind, WorkoutPhoto } from '@/types/models';

type PhotoRow = {
  id: number;
  workout_id: number | null;
  route_id: number | null;
  uri: string;
  kind: PhotoKind;
  caption: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: number;
};

function toPhoto(row: PhotoRow): WorkoutPhoto {
  return {
    id: row.id,
    workoutId: row.workout_id,
    routeId: row.route_id,
    uri: row.uri,
    kind: row.kind,
    caption: row.caption,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
  };
}

export type NewPhoto = {
  uri: string;
  kind: PhotoKind;
  caption?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  workoutId?: number | null;
  routeId?: number | null;
};

export async function createPhoto(input: NewPhoto): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO photos
       (workout_id, route_id, uri, kind, caption, latitude, longitude, created_at)
     VALUES ($workoutId, $routeId, $uri, $kind, $caption, $lat, $lng, $now)`,
    {
      $workoutId: input.workoutId ?? null,
      $routeId: input.routeId ?? null,
      $uri: input.uri,
      $kind: input.kind,
      $caption: input.caption ?? null,
      $lat: input.latitude ?? null,
      $lng: input.longitude ?? null,
      $now: Date.now(),
    },
  );
  return result.lastInsertRowId;
}

export async function listPhotosForWorkout(workoutId: number): Promise<WorkoutPhoto[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PhotoRow>(
    'SELECT * FROM photos WHERE workout_id = $id ORDER BY created_at ASC',
    { $id: workoutId },
  );
  return rows.map(toPhoto);
}

export async function listPhotosForRoute(routeId: number): Promise<WorkoutPhoto[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PhotoRow>(
    'SELECT * FROM photos WHERE route_id = $id ORDER BY created_at DESC',
    { $id: routeId },
  );
  return rows.map(toPhoto);
}

export async function updatePhotoCaption(id: number, caption: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE photos SET caption = $caption WHERE id = $id', {
    $id: id,
    $caption: caption,
  });
}

export async function deletePhoto(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM photos WHERE id = $id', { $id: id });
}
