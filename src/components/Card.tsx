import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, fontSize, radius, shadow, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  title?: string;
  style?: ViewStyle;
};

export function Card({ children, title, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  rowLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  rowValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
});
