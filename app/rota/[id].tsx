import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/AppButton';
import { Card, Row } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Pill } from '@/components/Pill';
import { StatTile } from '@/components/StatTile';
import { listPhotosForRoute, deletePhoto } from '@/db/photos';
import { deleteRoute, getRouteById } from '@/db/routes';
import { defaultSettings, getSettings, type AppSettings } from '@/db/settings';
import { listWorkouts } from '@/db/workouts';
import { colors, difficultyColors, difficultyLabels, fontSize, radius, spacing } from '@/theme';
import type { Route, Workout, WorkoutPhoto } from '@/types/models';
import { DEFAULT_REGION } from '@/utils/geo';
import { distanceWithUnit, formatDateTime, formatDuration, formatRelative } from '@/utils/format';

export default function RotaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routeId = Number(id);

  const [route, setRoute] = useState<Route | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [photos, setPhotos] = useState<WorkoutPhoto[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const load = useCallback(async () => {
    const [currentRoute, allWorkouts, currentSettings, routePhotos] = await Promise.all([
      getRouteById(routeId),
      listWorkouts(),
      getSettings(),
      listPhotosForRoute(routeId),
    ]);

    setRoute(currentRoute);
    setSettings(currentSettings);
    setPhotos(routePhotos);
    setWorkouts(allWorkouts.filter((item) => item.routeId === routeId));
  }, [routeId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!route) {
    return (
      <View style={styles.centre}>
        <EmptyState icon="alert-circle-outline" title="Rota não encontrada" />
      </View>
    );
  }

  const totalDistance = workouts.reduce((sum, item) => sum + item.distanceMeters, 0);
  const totalTime = workouts.reduce((sum, item) => sum + item.durationSeconds, 0);

  const region: Region =
    route.startLatitude != null && route.startLongitude != null
      ? {
          latitude: route.startLatitude,
          longitude: route.startLongitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : (DEFAULT_REGION as Region);

  const confirmDelete = () => {
    Alert.alert('Excluir rota?', 'Os percursos feitos nela serão mantidos, sem vínculo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteRoute(routeId);
            router.replace('/');
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: route.name }} />

      <MapView style={styles.map} initialRegion={region} scrollEnabled={false} zoomEnabled={false}>
        {route.startLatitude != null && route.startLongitude != null ? (
          <Marker
            coordinate={{
              latitude: route.startLatitude,
              longitude: route.startLongitude,
            }}
            title="Início"
            description="Ponto de início da rota"
          />
        ) : null}
      </MapView>

      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={2}>
            {route.name}
          </Text>
          <Pill
            label={difficultyLabels[route.difficulty]}
            color={difficultyColors[route.difficulty]}
            background={`${difficultyColors[route.difficulty]}1A`}
          />
        </View>

        {route.description ? <Text style={styles.description}>{route.description}</Text> : null}

        <View style={styles.statsRow}>
          <StatTile
            icon="navigate"
            label="distância"
            value={distanceWithUnit(route.distanceMeters, settings.units)}
            tone="brand"
            compact
          />
          <StatTile
            icon="trending-up"
            label="desnível"
            value={`${Math.round(route.elevationGainMeters)} m`}
            compact
          />
          <StatTile
            icon="map"
            label="percursos"
            value={String(workouts.length)}
            compact
          />
        </View>

        <Card title="Acumulado nesta rota">
          <Row label="Distância total" value={distanceWithUnit(totalDistance, settings.units)} />
          <Row label="Tempo total" value={formatDuration(totalTime)} />
          <Row label="Criada em" value={formatDateTime(route.createdAt)} />
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Percursos</Text>
        </View>

        {workouts.length === 0 ? (
          <EmptyState
            icon="walk-outline"
            title="Nenhum percurso nesta rota"
            description="Registre um percurso para comparar seus tempos."
          />
        ) : (
          workouts.map((item) => (
            <Card
              key={item.id}
              style={styles.workoutRow}
            >
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutDate}>{formatRelative(item.startedAt)}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textMuted}
                  onPress={() =>
                    router.push({ pathname: '/treino/[id]', params: { id: String(item.id) } })
                  }
                />
              </View>
              <View style={styles.workoutPills}>
                <Pill label={distanceWithUnit(item.distanceMeters, settings.units)} icon="navigate" />
                <Pill
                  label={formatDuration(item.durationSeconds)}
                  color={colors.info}
                  background={colors.infoSurface}
                />
              </View>
            </Card>
          ))
        )}

        {photos.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Fotos</Text>
            {photos.map((photo) => (
              <Card key={photo.id} style={styles.workoutRow}>
                <Text style={styles.workoutDate}>{formatDateTime(photo.createdAt)}</Text>
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={colors.danger}
                  onPress={() => {
                    void (async () => {
                      await deletePhoto(photo.id);
                      await load();
                    })();
                  }}
                />
              </Card>
            ))}
          </>
        ) : null}

        <AppButton
          label="Rastrear esta rota"
          icon="play"
          onPress={() => router.push('/rastrear')}
        />
        <AppButton label="Excluir rota" variant="danger" onPress={confirmDelete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centre: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
  map: { width: '100%', height: 220 },
  sheet: { flex: 1, padding: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  description: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  sectionHeader: { marginTop: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  workoutRow: { gap: spacing.sm, borderRadius: radius.md },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workoutDate: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  workoutPills: { flexDirection: 'row', gap: spacing.xs },
});
