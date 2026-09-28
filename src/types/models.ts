export type Difficulty = 'facil' | 'media' | 'dificil';

export type WorkoutStatus = 'ativo' | 'finalizado' | 'descartado';

export type PhotoKind = 'galeria' | 'camera';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type Route = {
  id: number;
  name: string;
  description: string | null;
  difficulty: Difficulty;
  distanceMeters: number;
  elevationGainMeters: number;
  startLatitude: number | null;
  startLongitude: number | null;
  coverUri: string | null;
  createdAt: number;
  lastWorkoutAt: number | null;
  totalWorkouts: number;
};

export type TrackPoint = LatLng & {
  id: number;
  workoutId: number;
  seq: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  recordedAt: number;
};

export type Workout = {
  id: number;
  routeId: number | null;
  routeName: string | null;
  name: string;
  status: WorkoutStatus;
  startedAt: number;
  endedAt: number | null;
  durationSeconds: number;
  distanceMeters: number;
  avgSpeedMps: number;
  maxSpeedMps: number;
  steps: number;
  notes: string | null;
  sharedContactId: string | null;
  sharedContactName: string | null;
};

export type WorkoutPhoto = {
  id: number;
  workoutId: number | null;
  routeId: number | null;
  uri: string;
  kind: PhotoKind;
  caption: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: number;
};

export type Totals = {
  totalWorkouts: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalSteps: number;
};

export type DeviceContact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};
