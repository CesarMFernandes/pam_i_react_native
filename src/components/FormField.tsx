import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
};

export function FormField({ label, hint, error, style, ...inputProps }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.trackPending}
        {...inputProps}
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  hint: { fontSize: fontSize.xs, color: colors.textMuted },
  error: { fontSize: fontSize.xs, color: colors.danger },
});
