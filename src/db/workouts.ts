import { getDatabase } from './index';
import type { TrackPoint, Workout, WorkoutStatus } from '@/types/models';

type WorkoutRow = {
  id: number;
  route_id: number | null;
  route_name: string | null;
  name: string;
  status: WorkoutStatus;
  started_at: number;
  ended_at: number | null;
  duration_seconds: number;
  distance_meters: number;
  avg_speed_mps: number;
  max_speed_mps: number;
  steps: number;
  notes: string | null;
  shared_contact_id: string | null;
  shared_contact_name: string | null;
};

function toWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    routeId: row.route_id,
    routeName: row.route_name,
    name: row.name,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    distanceMeters: row.distance_meters,
    avgSpeedMps: row.avg_speed_mps,
    maxSpeedMps: row.max_speed_mps,
    steps: row.steps,
    notes: row.notes,
    sharedContactId: row.shared_contact_id,
    sharedContactName: row.shared_contact_name,
  };
}

const SELECT_BASE = `
  SELECT w.*, r.name AS route_name
  FROM workouts w
  LEFT JOIN routes r ON r.id = w.route_id
`;

export async function listWorkouts(limit = 100): Promise<Workout[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WorkoutRow>(
    `${SELECT_BASE} WHERE w.status != 'ativo' ORDER BY w.started_at DESC LIMIT $limit`,
    { $limit: limit },
  );
  return rows.map(toWorkout);
}

export async function getWorkoutById(id: number): Promise<Workout | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<WorkoutRow>(`${SELECT_BASE} WHERE w.id = $id`, { $id: id });
  return row ? toWorkout(row) : null;
}

/** Treino em andamento, usado para retomar o rastreio após o app ser fechado. */
export async function getActiveWorkout(): Promise<Workout | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<WorkoutRow>(
    `${SELECT_BASE} WHERE w.status = 'ativo' ORDER BY w.started_at DESC LIMIT 1`,
  );
  return row ? toWorkout(row) : null;
}

export type NewWorkout = {
  routeId?: number | null;
  name: string;
};

export async function createWorkout(input: NewWorkout): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO workouts (route_id, name, status, started_at)
     VALUES ($routeId, $name, 'ativo', $now)`,
    { $routeId: input.routeId ?? null, $name: input.name, $now: Date.now() },
  );
  return result.lastInsertRowId;
}

export type WorkoutStats = {
  durationSeconds: number;
  distanceMeters: number;
  avgSpeedMps: number;
  maxSpeedMps: number;
  steps: number;
  notes?: string | null;
};

export async function finishWorkout(id: number, stats: WorkoutStats): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE workouts SET
       status = 'finalizado',
       ended_at = $endedAt,
       duration_seconds = $duration,
       distance_meters = $distance,
       avg_speed_mps = $avg,
       max_speed_mps = $max,
       steps = $steps,
       notes = $notes
     WHERE id = $id`,
    {
      $id: id,
      $endedAt: Date.now(),
      $duration: stats.durationSeconds,
      $distance: stats.distanceMeters,
      $avg: stats.avgSpeedMps,
      $max: stats.maxSpeedMps,
      $steps: stats.steps,
      $notes: stats.notes ?? null,
    },
  );
}

export async function discardWorkout(id: number): Promise<void> {
  const db = await getDatabase();
  // track_points cai junto por causa do ON DELETE CASCADE
  await db.runAsync(`DELETE FROM workouts WHERE id = $id`, { $id: id });
}

export async function attachContact(id: number, contactId: string, contactName: string) {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE workouts SET shared_contact_id = $cid, shared_contact_name = $cname WHERE id = $id',
    { $id: id, $cid: contactId, $cname: contactName },
  );
}

export async function listTrackPoints(workoutId: number): Promise<TrackPoint[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    workout_id: number;
    seq: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    speed: number | null;
    heading: number | null;
    recorded_at: number;
  }>(
    'SELECT * FROM track_points WHERE workout_id = $id ORDER BY seq ASC',
    { $id: workoutId },
  );

  return rows.map((row) => ({
    id: row.id,
    workoutId: row.workout_id,
    seq: row.seq,
    latitude: row.latitude,
    longitude: row.longitude,
    altitude: row.altitude,
    accuracy: row.accuracy,
    speed: row.speed,
    heading: row.heading,
    recordedAt: row.recorded_at,
  }));
}

export async function appendTrackPoint(
  workoutId: number,
  seq: number,
  point: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number | null;
    speed?: number | null;
    heading?: number | null;
  },
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO track_points
       (workout_id, seq, latitude, longitude, altitude, accuracy, speed, heading, recorded_at)
     VALUES ($workoutId, $seq, $lat, $lng, $alt, $acc, $speed, $heading, $now)`,
    {
      $workoutId: workoutId,
      $seq: seq,
      $lat: point.latitude,
      $lng: point.longitude,
      $alt: point.altitude ?? null,
      $acc: point.accuracy ?? null,
      $speed: point.speed ?? null,
      $heading: point.heading ?? null,
      $now: Date.now(),
    },
  );
}

export type Waypoint = {
  id: number;
  workoutId: number;
  latitude: number;
  longitude: number;
  label: string | null;
  createdAt: number;
};

export async function addWaypoint(
  workoutId: number,
  point: { latitude: number; longitude: number; label?: string | null },
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO waypoints (workout_id, latitude, longitude, label, created_at)
     VALUES ($workoutId, $lat, $lng, $label, $now)`,
    {
      $workoutId: workoutId,
      $lat: point.latitude,
      $lng: point.longitude,
      $label: point.label ?? null,
      $now: Date.now(),
    },
  );
  return result.lastInsertRowId;
}

export async function listWaypoints(workoutId: number): Promise<Waypoint[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    workout_id: number;
    latitude: number;
    longitude: number;
    label: string | null;
    created_at: number;
  }>('SELECT * FROM waypoints WHERE workout_id = $id ORDER BY created_at ASC', {
    $id: workoutId,
  });

  return rows.map((row) => ({
    id: row.id,
    workoutId: row.workout_id,
    latitude: row.latitude,
    longitude: row.longitude,
    label: row.label,
    createdAt: row.created_at,
  }));
}

export async function deleteWaypoint(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM waypoints WHERE id = $id', { $id: id });
}

export type TotalsRow = {
  total_workouts: number;
  total_distance: number;
  total_duration: number;
  total_steps: number;
};

export async function getTotals(): Promise<{
  totalWorkouts: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalSteps: number;
}> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TotalsRow>(
    `SELECT
       COUNT(*)                                        AS total_workouts,
       COALESCE(SUM(distance_meters), 0)               AS total_distance,
       COALESCE(SUM(duration_seconds), 0)              AS total_duration,
       COALESCE(SUM(steps), 0)                         AS total_steps
     FROM workouts
     WHERE status = 'finalizado'`,
  );

  return {
    totalWorkouts: row?.total_workouts ?? 0,
    totalDistanceMeters: row?.total_distance ?? 0,
    totalDurationSeconds: row?.total_duration ?? 0,
    totalSteps: row?.total_steps ?? 0,
  };
}
