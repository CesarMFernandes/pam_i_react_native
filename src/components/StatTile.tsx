import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, radius, spacing } from '@/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone?: 'default' | 'brand' | 'warning' | 'success';
  compact?: boolean;
};

const tones = {
  default: { fg: colors.text, bg: colors.surfaceAlt },
  brand: { fg: colors.brand, bg: colors.brandSurface },
  warning: { fg: colors.warning, bg: colors.warningSurface },
  success: { fg: colors.success, bg: colors.successSurface },
} as const;

export function StatTile({ icon, label, value, tone = 'default', compact = false }: Props) {
  const palette = tones[tone];

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: palette.bg },
        compact && styles.compact,
      ]}
    >
      <Ionicons name={icon} size={compact ? 14 : 18} color={palette.fg} />
      <Text style={[styles.value, { color: palette.fg }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  compact: { paddingVertical: spacing.sm },
  value: { fontSize: fontSize.lg, fontWeight: '700' },
  label: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
