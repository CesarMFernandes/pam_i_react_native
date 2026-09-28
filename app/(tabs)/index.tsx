import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { EmptyState } from '@/components/EmptyState';
import { RouteCard } from '@/components/RouteCard';
import { Screen } from '@/components/Screen';
import { StatTile } from '@/components/StatTile';
import { listRoutes } from '@/db/routes';
import { getSettings, type AppSettings, defaultSettings } from '@/db/settings';
import { getTotals } from '@/db/workouts';
import { colors, fontSize, radius, shadow, spacing } from '@/theme';
import type { Route, Totals } from '@/types/models';
import { distanceWithUnit, formatDuration } from '@/utils/format';

const EMPTY_TOTALS: Totals = {
  totalWorkouts: 0,
  totalDistanceMeters: 0,
  totalDurationSeconds: 0,
  totalSteps: 0,
};

export default function RotasScreen() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [totals, setTotals] = useState<Totals>(EMPTY_TOTALS);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [routeRows, totalRows, currentSettings] = await Promise.all([
      listRoutes(),
      getTotals(),
      getSettings(),
    ]);

    setRoutes(routeRows);
    setTotals(totalRows);
    setSettings(currentSettings);
  }, []);

  // useFocusEffect recarrega a cada volta para a aba, mantendo a lista sincronizada.
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
    <Screen scroll={false} padded={false}>
      <FlatList
        data={routes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.totalsRow}>
              <StatTile
                icon="navigate"
                label="distância"
                value={distanceWithUnit(totals.totalDistanceMeters, settings.units)}
                tone="brand"
              />
              <StatTile
                icon="flag"
                label="percursos"
                value={String(totals.totalWorkouts)}
              />
              <StatTile
                icon="time"
                label="tempo"
                value={formatDuration(totals.totalDurationSeconds)}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Minhas rotas</Text>
              {routes.length > 0 ? (
                <Text style={styles.sectionCount}>{routes.length}</Text>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="map-outline"
            title="Nenhuma rota cadastrada"
            description="Crie sua primeira rota para começar a registrar percursos."
          />
        }
        renderItem={({ item }) => (
          <RouteCard
            route={item}
            units={settings.units}
            onPress={() =>
              router.push({ pathname: '/rota/[id]', params: { id: String(item.id) } })
            }
          />
        )}
      />

      <View style={styles.footer}>
        <AppButton
          label="Nova rota"
          icon="add"
          onPress={() => router.push('/rota/nova')}
          style={styles.footerButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { gap: spacing.lg, marginBottom: spacing.sm },
  totalsRow: { flexDirection: 'row', gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  sectionCount: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.brand,
    backgroundColor: colors.brandSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
  footerButton: { ...shadow },
});
