import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/AppButton';
import { Card, Row } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { StatTile } from '@/components/StatTile';
import { createPhoto, listPhotosForWorkout, deletePhoto } from '@/db/photos';
import { defaultSettings, getSettings, type AppSettings } from '@/db/settings';
import { discardWorkout, getWorkoutById, listTrackPoints, listWaypoints, type Waypoint } from '@/db/workouts';
import { persistImage } from '@/services/media';
import { colors, fontSize, radius, spacing } from '@/theme';
import type { LatLng, Workout, WorkoutPhoto } from '@/types/models';
import { DEFAULT_REGION, elevationGain } from '@/utils/geo';
import {
  distanceWithUnit,
  formatDateTime,
  formatDuration,
  formatPace,
  formatSpeed,
  pluralize,
} from '@/utils/format';

export default function TreinoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [points, setPoints] = useState<(LatLng & { altitude: number | null })[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [photos, setPhotos] = useState<WorkoutPhoto[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const load = useCallback(async () => {
    const [current, track, marks, currentPhotos, currentSettings] = await Promise.all([
      getWorkoutById(workoutId),
      listTrackPoints(workoutId),
      listWaypoints(workoutId),
      listPhotosForWorkout(workoutId),
      getSettings(),
    ]);

    setWorkout(current);
    setPoints(track);
    setWaypoints(marks);
    setPhotos(currentPhotos);
    setSettings(currentSettings);
  }, [workoutId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const addPhoto = async (fromCamera: boolean) => {
    if (fromCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Precisamos da câmera para tirar a foto.');
        return;
      }
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Precisamos da galeria para escolher a foto.');
        return;
      }
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    };

    // No emulador/simulador a câmera não existe, então cai para a galeria.
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options).catch(() => null)
      : null;

    const chosen =
      result ?? (await ImagePicker.launchImageLibraryAsync(options));

    if (!chosen || chosen.canceled) return;

    const asset = chosen.assets[0];
    const uri = await persistImage(asset);
    const last = points[points.length - 1];

    await createPhoto({
      uri,
      kind: fromCamera ? 'camera' : 'galeria',
      workoutId,
      latitude: last?.latitude ?? null,
      longitude: last?.longitude ?? null,
    });

    await load();
  };

  const share = async () => {
    if (!workout) return;

    const summary =
      `${workout.name}\n` +
      `${distanceWithUnit(workout.distanceMeters, settings.units)} em ${formatDuration(workout.durationSeconds)}\n` +
      `Velocidade média: ${formatSpeed(workout.avgSpeedMps, settings.units)}\n` +
      `${pluralize(workout.steps, 'passo', 'passos')}`;

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Resumo do percurso', summary);
      return;
    }

    // `Sharing.shareAsync` só aceita URL de arquivo — o texto puro não
    // seria compartilhável. Por isso o resumo vira um .txt no cache.
    const file = new File(Paths.cache, `rota-rn-${workout.id}.txt`);
    await file.create({ overwrite: true, intermediates: true });
    await file.write(summary);

    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/plain',
      dialogTitle: 'Compartilhar percurso',
      UTI: 'public.plain-text',
    });
  };

  if (!workout) {
    return (
      <View style={styles.centre}>
        <EmptyState icon="alert-circle-outline" title="Percurso não encontrado" />
      </View>
    );
  }

  const coordinates = points.map(({ latitude, longitude }) => ({ latitude, longitude }));

  const region: Region =
    coordinates.length > 0
      ? {
          ...coordinates[0],
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }
      : (DEFAULT_REGION as Region);

  const confirmDelete = () => {
    Alert.alert('Excluir percurso?', 'O traçado e as fotos serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await discardWorkout(workoutId);
            router.back();
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: workout.name }} />

      <MapView style={styles.map} initialRegion={region}>
        {coordinates.length > 1 ? (
          <Polyline coordinates={coordinates} strokeColor={colors.track} strokeWidth={5} />
        ) : null}

        {coordinates[0] ? <Marker coordinate={coordinates[0]} title="Início" /> : null}

        {waypoints.map((mark) => (
          <Marker
            key={mark.id}
            coordinate={{ latitude: mark.latitude, longitude: mark.longitude }}
            title={mark.label ?? 'Marco'}
            pinColor={colors.warning}
          />
        ))}
      </MapView>

      <FlatList
        data={photos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{workout.name}</Text>
            <Text style={styles.subtitle}>{formatDateTime(workout.startedAt)}</Text>

            <View style={styles.statsRow}>
              <StatTile
                icon="navigate"
                label="distância"
                value={distanceWithUnit(workout.distanceMeters, settings.units)}
                tone="brand"
                compact
              />
              <StatTile
                icon="time"
                label="duração"
                value={formatDuration(workout.durationSeconds)}
                compact
              />
              <StatTile
                icon="footsteps"
                label="passos"
                value={String(workout.steps)}
                compact
              />
            </View>

            <View style={styles.statsRow}>
              <StatTile
                icon="speedometer"
                label="média"
                value={formatSpeed(workout.avgSpeedMps, settings.units)}
                tone="success"
                compact
              />
              <StatTile
                icon="rocket"
                label="máxima"
                value={formatSpeed(workout.maxSpeedMps, settings.units)}
                compact
              />
              <StatTile
                icon="trending-up"
                label="desnível"
                value={`${Math.round(elevationGain(points))} m`}
                compact
              />
            </View>

            <Card title="Detalhes">
              <Row label="Ritmo" value={formatPace(workout.distanceMeters, workout.durationSeconds)} />
              <Row label="Pontos gravados" value={String(points.length)} />
              <Row label="Marcos" value={String(waypoints.length)} />
              {workout.sharedContactName ? (
                <Row label="Compartilhado com" value={workout.sharedContactName} />
              ) : null}
            </Card>

            <View style={styles.actions}>
              <AppButton
                label="Compartilhar"
                icon="share-outline"
                variant="secondary"
                onPress={() => void share()}
                style={styles.action}
              />
              <AppButton
                label="Enviar para contato"
                icon="person"
                variant="secondary"
                onPress={() =>
                  router.push({ pathname: '/contatos', params: { workoutId: String(workoutId) } })
                }
                style={styles.action}
              />
            </View>

            <View style={styles.actions}>
              <AppButton
                label="Câmera"
                icon="camera"
                variant="secondary"
                size="sm"
                onPress={() => void addPhoto(true)}
                style={styles.action}
              />
              <AppButton
                label="Galeria"
                icon="images"
                variant="secondary"
                size="sm"
                onPress={() => void addPhoto(false)}
                style={styles.action}
              />
            </View>

            <Text style={styles.sectionTitle}>Fotos do percurso</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhuma foto ainda. Use os botões acima para adicionar.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.photoCard}>
            <Image source={{ uri: item.uri }} style={styles.photo} />
            <Pressable
              style={styles.photoRemove}
              onPress={() => {
                void (async () => {
                  await deletePhoto(item.id);
                  await load();
                })();
              }}
            >
              <Ionicons name="trash" size={15} color={colors.textInverse} />
            </Pressable>
            {item.kind === 'camera' ? (
              <View style={styles.badge}>
                <Ionicons name="camera" size={10} color={colors.textInverse} />
              </View>
            ) : null}
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <AppButton label="Excluir percurso" variant="danger" onPress={confirmDelete} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centre: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
  map: { width: '100%', height: 240 },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { gap: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: -spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  photoCard: { borderRadius: radius.md, overflow: 'hidden' },
  photo: { width: '100%', height: 190 },
  photoRemove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(15,23,42,0.65)',
    padding: spacing.sm,
    borderRadius: radius.pill,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.brand,
    padding: spacing.xs,
    borderRadius: radius.pill,
  },
  footer: { marginTop: spacing.lg },
});
