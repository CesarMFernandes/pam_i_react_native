import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSize, radius, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: ViewStyle;
};

export function Screen({
  children,
  title,
  subtitle,
  scroll = true,
  padded = true,
  contentStyle,
}: Props) {
  const body = (
    <View style={[padded && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}

      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  padded: { padding: spacing.lg, gap: spacing.lg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted },
});

export { radius };
