import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { EmptyState } from '@/components/EmptyState';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { defaultSettings, getSettings, type AppSettings } from '@/db/settings';
import { listWorkouts } from '@/db/workouts';
import { colors, fontSize, radius, spacing } from '@/theme';
import type { Workout } from '@/types/models';
import { distanceWithUnit, formatDateTime, formatDuration, formatSpeed } from '@/utils/format';

export default function HistoricoScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [rows, currentSettings] = await Promise.all([listWorkouts(), getSettings()]);
    setWorkouts(rows);
    setSettings(currentSettings);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <Screen scroll={false} padded={false} title="Histórico" subtitle="Seus percursos registrados">
      <FlatList
        data={workouts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="Nenhum percurso ainda"
            description="Vá até a aba Rastrear e registre seu primeiro percurso."
          />
        }
        renderItem={({ item }) => (
          <View
            style={styles.item}
            onTouchEnd={() =>
              router.push({ pathname: '/treino/[id]', params: { id: String(item.id) } })
            }
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>

            <Text style={styles.itemDate}>{formatDateTime(item.startedAt)}</Text>

            <View style={styles.pills}>
              <Pill
                label={distanceWithUnit(item.distanceMeters, settings.units)}
                icon="navigate"
              />
              <Pill
                label={formatDuration(item.durationSeconds)}
                color={colors.info}
                background={colors.infoSurface}
              />
              <Pill
                label={formatSpeed(item.avgSpeedMps, settings.units)}
                color={colors.success}
                background={colors.successSurface}
              />
              {item.steps > 0 ? (
                <Pill
                  label={`${item.steps} passos`}
                  color={colors.warning}
                  background={colors.warningSurface}
                />
              ) : null}
            </View>

            {item.sharedContactName ? (
              <Text style={styles.shared}>
                <Ionicons name="paper-plane" size={11} color={colors.brand} /> compartilhado com{' '}
                {item.sharedContactName}
              </Text>
            ) : null}
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemName: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  itemDate: { fontSize: fontSize.xs, color: colors.textMuted },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  shared: { fontSize: fontSize.xs, color: colors.brand, marginTop: spacing.xs },
});
