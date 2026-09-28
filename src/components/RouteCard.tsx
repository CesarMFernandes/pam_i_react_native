import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Pill } from '@/components/Pill';
import { colors, difficultyColors, difficultyLabels, fontSize, radius, shadow, spacing } from '@/theme';
import type { Route } from '@/types/models';
import { distanceWithUnit, formatRelative, pluralize } from '@/utils/format';
import type { UnitSystem } from '@/utils/format';

type Props = {
  route: Route;
  units: UnitSystem;
  onPress: () => void;
};

export function RouteCard({ route, units, onPress }: Props) {
  const cover = route.coverUri ? (
    <Image source={{ uri: route.coverUri }} style={styles.cover} />
  ) : (
    <View style={[styles.cover, styles.coverFallback]}>
      <Ionicons name="trail-sign" size={26} color={colors.brand} />
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir rota ${route.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {cover}

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {route.name}
          </Text>
          <Pill
            label={difficultyLabels[route.difficulty]}
            color={difficultyColors[route.difficulty]}
            background={`${difficultyColors[route.difficulty]}1A`}
          />
        </View>

        {route.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {route.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Ionicons name="walk" size={14} color={colors.textMuted} />
          <Text style={styles.meta}>{distanceWithUnit(route.distanceMeters, units)}</Text>

          <Ionicons
            name="trending-up"
            size={14}
            color={colors.textMuted}
            style={styles.metaIconSpacing}
          />
          <Text style={styles.meta}>{Math.round(route.elevationGainMeters)} m</Text>
        </View>

        <Text style={styles.footer}>
          {route.lastWorkoutAt
            ? `${pluralize(route.totalWorkouts, 'percurso', 'percursos')} · ${formatRelative(route.lastWorkoutAt)}`
            : 'Nenhum percurso registrado'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  pressed: { opacity: 0.7 },
  cover: { width: 92, height: 108 },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSurface,
  },
  body: { flex: 1, padding: spacing.md, gap: spacing.xs },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  description: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  metaIconSpacing: { marginLeft: spacing.sm },
  meta: { fontSize: fontSize.sm, color: colors.text },
  footer: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
});
