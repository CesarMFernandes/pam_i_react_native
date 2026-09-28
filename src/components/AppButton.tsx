import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, radius, spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

const backgrounds: Record<Variant, string> = {
  primary: colors.brand,
  secondary: colors.surfaceAlt,
  ghost: 'transparent',
  danger: colors.danger,
};

const foregrounds: Record<Variant, string> = {
  primary: colors.textInverse,
  secondary: colors.text,
  ghost: colors.brand,
  danger: colors.textInverse,
};

const heights: Record<Size, number> = { sm: 36, md: 44, lg: 52 };

export function AppButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height: heights[size],
          backgroundColor: backgrounds[variant],
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.border,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <View style={styles.content}>
        {icon ? (
          <Ionicons
            name={icon}
            size={size === 'sm' ? 16 : 18}
            color={foregrounds[variant]}
            style={styles.icon}
          />
        ) : null}
        <Text style={[styles.label, { color: foregrounds[variant] }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  label: { fontSize: fontSize.md, fontWeight: '600' },
});
