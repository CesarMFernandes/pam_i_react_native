import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/AppButton';
import { Card, Row } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { resetDatabase } from '@/db';
import { defaultSettings, getSettings, setSetting, settingKeys, type AppSettings } from '@/db/settings';
import { useLocationPermissions, useNotificationPermission } from '@/hooks/usePermissions';
import { cancelDailyReminder, scheduleDailyReminder } from '@/services/notifications';
import { colors, fontSize, radius, spacing } from '@/theme';

export default function AjustesScreen() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [reminderId, setReminderId] = useState<string | null>(null);
  const location = useLocationPermissions();
  const notifications = useNotificationPermission();

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  const update = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
    await setSetting(key, value);
  }, []);

  const toggleReminder = useCallback(
    async (enabled: boolean) => {
      await update(settingKeys.reminderEnabled, enabled);

      await cancelDailyReminder(reminderId);
      setReminderId(null);

      if (!enabled) return;

      const granted = notifications.granted ?? (await notifications.request());
      if (!granted) {
        await update(settingKeys.reminderEnabled, false);
        Alert.alert(
          'Permissão negada',
          'Ative as notificações nos ajustes do sistema para receber lembretes.',
        );
        return;
      }

      const id = await scheduleDailyReminder(
        settings.reminderHour,
        settings.reminderMinute,
      );

      if (!id) {
        await update(settingKeys.reminderEnabled, false);
        Alert.alert(
          'Lembrete indisponível',
          'Este ambiente não conseguiu agendar notificações. Em um development build (veja o README) funciona normalmente.',
        );
        return;
      }

      setReminderId(id);
    },
    [update, reminderId, notifications, settings.reminderHour, settings.reminderMinute],
  );

  const askBackgroundLocation = useCallback(async () => {
    const granted = await location.requestBackground();
    if (!granted) {
      Alert.alert(
        'Permissão não concedida',
        'No Android, a localização em segundo plano precisa ser liberada na tela de configurações do sistema.',
      );
    }
  }, [location]);

  const confirmWipe = useCallback(() => {
    Alert.alert(
      'Apagar todos os dados?',
      'Rotas, percursos, fotos e configurações serão removidos deste aparelho.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await resetDatabase();
              setSettings(defaultSettings);
              router.replace('/');
            })();
          },
        },
      ],
    );
  }, []);

  return (
    <Screen title="Ajustes" subtitle="Preferências do app e permissões">
      <Card title="Unidades">
        <View style={styles.segment}>
          {(['km', 'mi'] as const).map((unit) => {
            const active = settings.units === unit;
            return (
              <Text
                key={unit}
                onPress={() => void update(settingKeys.units, unit)}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
              >
                {unit === 'km' ? 'Quilômetros' : 'Milhas'}
              </Text>
            );
          })}
        </View>
      </Card>

      <Card title="Tela">
        <Row label="Manter a tela acesa durante o percurso" value="" />
        <View style={styles.switchRow}>
          <Switch
            value={settings.keepScreenOn}
            onValueChange={(value) => void update(settingKeys.keepScreenOn, value)}
            trackColor={{ true: colors.brand }}
          />
        </View>
      </Card>

      <Card title="Permissões">
        <Row
          label="Localização em primeiro plano"
          value={location.foreground ? 'concedida' : 'negada'}
        />
        <Row
          label="Localização em segundo plano"
          value={location.background ? 'concedida' : 'negada'}
        />
        {location.canAskBackground ? (
          <AppButton
            label="Liberar localização em segundo plano"
            variant="secondary"
            size="sm"
            icon="navigate"
            onPress={() => void askBackgroundLocation()}
          />
        ) : null}

        <View style={styles.divider} />

        <Row
          label="Notificações"
          value={notifications.granted ? 'concedida' : 'não solicitada'}
        />
        {notifications.granted !== true ? (
          <AppButton
            label="Permitir notificações"
            variant="secondary"
            size="sm"
            icon="notifications"
            onPress={() => void notifications.request()}
          />
        ) : null}

        <View style={styles.divider} />

        <Row
          label="Contatos"
          value="solicitado ao compartilhar"
        />
        <AppButton
          label="Abrir ajustes do sistema"
          variant="ghost"
          size="sm"
          icon="settings-outline"
          onPress={() => void Linking.openSettings()}
        />
      </Card>

      <Card title="Lembrete diário">
        <Row label="Ativar lembrete de treino" value="" />
        <View style={styles.switchRow}>
          <Switch
            value={settings.reminderEnabled}
            onValueChange={(value) => void toggleReminder(value)}
            trackColor={{ true: colors.brand }}
          />
        </View>
        {settings.reminderEnabled ? (
          <Text style={styles.hint}>
            Todo dia às {String(settings.reminderHour).padStart(2, '0')}:
            {String(settings.reminderMinute).padStart(2, '0')}.
          </Text>
        ) : null}
      </Card>

      <Card title="Sobre">
        <Row label="Rota RN" value="1.0.0" />
        <Row label="Banco de dados" value="SQLite (local)" />
        <Row label="Plataforma" value={Platform.OS} />
        <Text style={styles.hint}>
          <Ionicons name="information-circle" size={12} color={colors.textMuted} /> Todos os dados
          ficam apenas neste aparelho.
        </Text>
      </Card>

      <AppButton label="Apagar todos os dados" variant="danger" onPress={confirmWipe} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    overflow: 'hidden',
  },
  segmentItemActive: { backgroundColor: colors.surface, color: colors.text },
  switchRow: { alignItems: 'flex-start' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});
