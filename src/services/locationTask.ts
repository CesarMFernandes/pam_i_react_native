import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

export const LOCATION_TASK_NAME = 'rastrear-rota-em-background';

/**
 * Onde a task em background grava os pontos. A task roda num contexto JS
 * separado do app (sem React), por isso precisa deste canal de memória
 * em vez de um hook.
 */
let activeWorkout: { id: number; nextSeq: number } | null = null;

export function setActiveBackgroundWorkout(id: number | null, nextSeq = 0): void {
  activeWorkout = id == null ? null : { id, nextSeq };
}

export function getActiveBackgroundWorkout(): { id: number; nextSeq: number } | null {
  return activeWorkout;
}

export function consumeSeq(): number {
  if (!activeWorkout) return 0;
  const seq = activeWorkout.nextSeq;
  activeWorkout.nextSeq += 1;
  return seq;
}

/**
 * Grava um ponto vindo do rastreamento. Usado tanto pela tela (foreground)
 * quanto pela task de background, para não duplicar a lógica de SQL.
 */
export async function persistPoint(
  workoutId: number,
  seq: number,
  location: Location.LocationObject,
): Promise<void> {
  const { appendTrackPoint } = await import('@/db/workouts');
  const { coords } = location;

  await appendTrackPoint(workoutId, seq, {
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitude: coords.altitude,
    accuracy: coords.accuracy,
    speed: coords.speed,
    heading: coords.heading,
  });
}

export function buildBackgroundTaskOptions(notificationTitle: string) {
  return {
    accuracy: Location.Accuracy.High,
    timeInterval: 5_000,
    distanceInterval: 5,
    activityType: Location.ActivityType.Fitness,
    showsBackgroundLocationIndicator: true,
    deferredUpdatesInterval: 1_000,
    deferredUpdatesDistance: 5,
    foregroundService: {
      notificationTitle,
      notificationBody: 'Registrando seu percurso',
      notificationColor: '#0F766E',
      killServiceOnDestroy: false,
    },
  } as const;
}

/**
 * Precisa rodar no escopo global do bundle: o TaskManager registra a task
 * de forma estática e não aceita chamadas dentro de useEffect.
 * O módulo é importado em `app/_layout.tsx` para garantir o registro.
 */
if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
    LOCATION_TASK_NAME,
    async ({ data, error }) => {
      if (error) return;
      if (!data?.locations?.length) return;

      const workout = getActiveBackgroundWorkout();
      if (!workout) return;

      for (const location of data.locations) {
        await persistPoint(workout.id, consumeSeq(), location);
      }
    },
  );
}
