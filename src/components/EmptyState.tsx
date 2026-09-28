import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, spacing } from '@/theme';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
};

export function EmptyState({ icon = 'map-outline', title, description }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={44} color={colors.trackPending} />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
