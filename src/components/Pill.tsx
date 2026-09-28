import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, radius, spacing } from '@/theme';

type Props = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  background?: string;
  onPress?: () => void;
};

export function Pill({
  label,
  icon,
  color = colors.brand,
  background = colors.brandSurface,
  onPress,
}: Props) {
  return (
    <View
      style={[styles.pill, { backgroundColor: background }]}
      onTouchEnd={onPress}
    >
      {icon ? <Ionicons name={icon} size={11} color={color} style={styles.icon} /> : null}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  icon: { marginRight: 1 },
  label: { fontSize: fontSize.xs, fontWeight: '700' },
});
