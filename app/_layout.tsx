import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import no escopo do módulo: registra a task de location em background.
// Precisa acontecer antes de qualquer tela, senão o OS não a encontra.
import '@/services/locationTask';

import { getDatabase } from '@/db';
import { colors, fontSize, spacing } from '@/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getDatabase()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.boot}>
        <Ionicons name="alert-circle" size={40} color={colors.danger} />
        <Text style={styles.bootTitle}>Não foi possível abrir o banco</Text>
        <Text style={styles.bootText}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={styles.bootText}>Preparando o banco de dados…</Text>
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="rota/nova" options={{ title: 'Nova rota', presentation: 'modal' }} />
        <Stack.Screen name="rota/[id]" options={{ title: 'Rota' }} />
        <Stack.Screen name="treino/[id]" options={{ title: 'Treino' }} />
        <Stack.Screen
          name="contatos"
          options={{ title: 'Compartilhar com', presentation: 'modal' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  bootTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  bootText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
});
