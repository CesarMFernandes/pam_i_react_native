import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/AppButton';
import { Card, Row } from '@/components/Card';
import { CompassDial } from '@/components/CompassDial';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { StatTile } from '@/components/StatTile';
import {
  addWaypoint,
  appendTrackPoint,
  createWorkout,
  discardWorkout,
  finishWorkout,
  getActiveWorkout,
  listTrackPoints,
  listWaypoints,
} from '@/db/workouts';
import { defaultSettings, getSettings, type AppSettings } from '@/db/settings';
import { listRoutes } from '@/db/routes';
import { useCompass } from '@/hooks/useCompass';
import { useLocationPermissions } from '@/hooks/usePermissions';
import { usePedometer } from '@/hooks/usePedometer';
import { useKeepScreenOn } from '@/hooks/useKeepScreenOn';
import { useShake } from '@/hooks/useShake';
import { notifyNow } from '@/services/notifications';
import {
  LOCATION_TASK_NAME,
  buildBackgroundTaskOptions,
  persistPoint,
  setActiveBackgroundWorkout,
} from '@/services/locationTask';
import { colors, fontSize, radius, spacing } from '@/theme';
import type { LatLng, Route, Workout } from '@/types/models';
import { DEFAULT_REGION, distanceBetween, isMeaningfulMove, totalDistance } from '@/utils/geo';
import { distanceWithUnit, formatPace, formatSpeed, formatStopwatch } from '@/utils/format';

type Subscription = { remove: () => void };

const MIN_MOVE_METERS = 4;
const USE_BACKGROUND_TASK = false; // true exige dev build — veja AGENTS.md

export default function RastrearScreen() {
  const permissions = useLocationPermissions();
  const compass = useCompass(true);

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [points, setPoints] = useState<LatLng[]>([]);
  const [waypointCount, setWaypointCount] = useState(0);
  const [current, setCurrent] = useState<LatLng | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [distance, setDistance] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);
  const seqRef = useRef(0);
  const lastPointRef = useRef<LatLng | null>(null);
  const locationSubRef = useRef<Subscription | null>(null);

  const tracking = workout != null;
  const { steps, available: pedometerAvailable } = usePedometer(tracking);
  useKeepScreenOn(settings.keepScreenOn && tracking);

  const elapsed = workout ? Math.floor((now - workout.startedAt) / 1000) : 0;

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const [currentSettings, routeRows, active] = await Promise.all([
          getSettings(),
          listRoutes(),
          getActiveWorkout(),
        ]);

        setSettings(currentSettings);
        setRoutes(routeRows);

        if (active) {
          setWorkout(active);

          const [stored, marks] = await Promise.all([
            listTrackPoints(active.id),
            listWaypoints(active.id),
          ]);

          setPoints(stored.map(({ latitude, longitude }) => ({ latitude, longitude })));
          seqRef.current = stored.length;
          lastPointRef.current = stored[stored.length - 1] ?? null;
          setDistance(totalDistance(stored));
          setWaypointCount(marks.length);
        }
      })();
    }, []),
  );

  // Cronômetro: `elapsed` é derivado de `now`, que só o intervalo atualiza.
  useEffect(() => {
    if (!workout) return;

    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, [workout]);

  const stopWatching = useCallback(() => {
    locationSubRef.current?.remove();
    locationSubRef.current = null;
  }, []);

  const onNewPosition = useCallback(
    async (workoutId: number, location: Location.LocationObject) => {
      const next: LatLng = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      const previous = lastPointRef.current;
      if (!isMeaningfulMove(previous, next, MIN_MOVE_METERS)) return;

      const added = previous ? distanceBetween(previous, next) : 0;
      lastPointRef.current = next;

      setCurrent(next);
      setPoints((accumulated) => [...accumulated, next]);
      setDistance((value) => value + added);

      if (location.coords.speed != null && location.coords.speed > 0) {
        setMaxSpeed((value) => Math.max(value, location.coords.speed ?? 0));
      }

      const seq = seqRef.current;
      seqRef.current += 1;
      await persistPoint(workoutId, seq, location);
    },
    [],
  );

  const start = useCallback(async () => {
    setGpsError(null);

    if (!permissions.foreground) {
      const granted = await permissions.requestForeground();
      if (!granted) {
        setGpsError('Precisamos da sua localização para registrar o percurso.');
        return;
      }
    }

    try {
      const first = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const origin = {
        latitude: first.coords.latitude,
        longitude: first.coords.longitude,
      };

      const route = routes.find((item) => item.id === selectedRouteId);
      const name = route?.name ?? `Percurso de ${new Date().toLocaleDateString('pt-BR')}`;

      const id = await createWorkout({ routeId: selectedRouteId, name });

      setWorkout({
        id,
        routeId: selectedRouteId,
        routeName: route?.name ?? null,
        name,
        status: 'ativo',
        startedAt: Date.now(),
        endedAt: null,
        durationSeconds: 0,
        distanceMeters: 0,
        avgSpeedMps: 0,
        maxSpeedMps: 0,
        steps: 0,
        notes: null,
        sharedContactId: null,
        sharedContactName: null,
      });

      setCurrent(origin);
      setPoints([origin]);
      setDistance(0);
      setMaxSpeed(0);
      setWaypointCount(0);
      setNow(Date.now());

      await appendTrackPoint(id, 0, {
        latitude: origin.latitude,
        longitude: origin.longitude,
        altitude: first.coords.altitude,
        accuracy: first.coords.accuracy,
        speed: first.coords.speed,
        heading: first.coords.heading,
      });

      seqRef.current = 1;
      lastPointRef.current = origin;
      setActiveBackgroundWorkout(id, 1);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: MIN_MOVE_METERS,
          timeInterval: 3_000,
        },
        (location) => {
          void onNewPosition(id, location);
        },
        (reason) => setGpsError(reason),
      );
      locationSubRef.current = subscription;

      if (USE_BACKGROUND_TASK) {
        await Location.startLocationUpdatesAsync(
          LOCATION_TASK_NAME,
          buildBackgroundTaskOptions('Rota RN está registrando'),
        );
      }
    } catch (error) {
      setGpsError(error instanceof Error ? error.message : 'Falha ao iniciar o GPS.');
    }
  }, [permissions, routes, selectedRouteId, onNewPosition]);

  useShake(tracking && current != null, () => {
    if (!workout || !current) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void addWaypoint(workout.id, {
      latitude: current.latitude,
      longitude: current.longitude,
      label: 'Marco',
    });
    setWaypointCount((value) => value + 1);
  });

  const stop = useCallback(async () => {
    if (!workout) return;

    stopWatching();
    setActiveBackgroundWorkout(null);

    if (USE_BACKGROUND_TASK) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {});
    }

    const finishedId = workout.id;
    const durationSeconds = Math.floor((Date.now() - workout.startedAt) / 1000);
    const avgSpeed = durationSeconds > 0 ? distance / durationSeconds : 0;

    await finishWorkout(finishedId, {
      durationSeconds,
      distanceMeters: distance,
      avgSpeedMps: avgSpeed,
      maxSpeedMps: maxSpeed,
      steps,
    });

    await notifyNow(
      'Percurso finalizado',
      `${distanceWithUnit(distance, settings.units)} em ${formatStopwatch(durationSeconds)}`,
    );

    setWorkout(null);
    setPoints([]);
    setCurrent(null);

    router.push({ pathname: '/treino/[id]', params: { id: String(finishedId) } });
  }, [workout, stopWatching, distance, maxSpeed, steps, settings.units]);

  const discard = useCallback(() => {
    if (!workout) return;

    Alert.alert('Descartar percurso?', 'Os pontos gravados serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            stopWatching();
            setActiveBackgroundWorkout(null);
            if (USE_BACKGROUND_TASK) {
              await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {});
            }
            await discardWorkout(workout.id);
            setWorkout(null);
            setPoints([]);
            setCurrent(null);
            setDistance(0);
          })();
        },
      },
    ]);
  }, [workout, stopWatching]);

  useEffect(() => stopWatching, [stopWatching]);

  const avgSpeed = elapsed > 0 ? distance / elapsed : 0;
  const region: Region = current
    ? {
        latitude: current.latitude,
        longitude: current.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
    : (DEFAULT_REGION as Region);

  if (!tracking) {
    return (
      <Screen title="Rastrear" subtitle="Registre o percurso enquanto você se move">
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>Escolha uma rota (opcional)</Text>
          <View style={styles.chips}>
            <Pill
              label="Percurso livre"
              onPress={() => setSelectedRouteId(null)}
              color={selectedRouteId === null ? colors.textInverse : colors.brand}
              background={selectedRouteId === null ? colors.brand : colors.brandSurface}
            />
            {routes.map((route) => {
              const active = selectedRouteId === route.id;
              return (
                <Pill
                  key={route.id}
                  label={route.name}
                  onPress={() => setSelectedRouteId(route.id)}
                  color={active ? colors.textInverse : colors.brand}
                  background={active ? colors.brand : colors.brandSurface}
                />
              );
            })}
          </View>
        </View>

        {gpsError ? (
          <Card>
            <Row label="GPS" value={gpsError} />
          </Card>
        ) : null}

        <CompassDial
          heading={compass.heading}
          accuracy={compass.accuracy}
          isTrueHeading={compass.isTrueHeading}
        />

        <AppButton label="Iniciar percurso" icon="play" size="lg" onPress={() => void start()} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false} contentStyle={styles.tracking}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        followsUserLocation
        toolbarEnabled={false}
      >
        {points.length > 1 ? (
          <Polyline coordinates={points} strokeColor={colors.track} strokeWidth={5} />
        ) : null}

        {current ? (
          <Marker coordinate={current} title="Você" description="Posição atual" />
        ) : null}
      </MapView>

      <View style={styles.sheet}>
        <Text style={styles.timer}>{formatStopwatch(elapsed)}</Text>

        <View style={styles.statsRow}>
          <StatTile
            icon="navigate"
            label="distância"
            value={distanceWithUnit(distance, settings.units)}
            tone="brand"
            compact
          />
          <StatTile
            icon="speedometer"
            label="velocidade"
            value={formatSpeed(avgSpeed, settings.units)}
            compact
          />
          <StatTile
            icon="footsteps"
            label="passos"
            value={pedometerAvailable ? String(steps) : '--'}
            compact
          />
        </View>

        <Text style={styles.hint}>
          <Ionicons name="phone-portrait" size={12} color={colors.textMuted} /> Chacoalhe o aparelho
          para marcar um marco ({waypointCount})
        </Text>

        {gpsError ? <Text style={styles.error}>{gpsError}</Text> : null}

        <View style={styles.actions}>
          <AppButton label="Descartar" variant="danger" onPress={discard} style={styles.action} />
          <AppButton
            label="Finalizar"
            icon="stop"
            size="lg"
            onPress={() => void stop()}
            style={styles.action}
          />
        </View>

        <Text style={styles.pace}>ritmo {formatPace(distance, elapsed)}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tracking: { padding: 0, gap: 0 },
  map: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  timer: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: { fontSize: fontSize.xs, color: colors.danger, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  pace: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
  pickerCard: { gap: spacing.md },
  pickerTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
