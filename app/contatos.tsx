import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/AppButton';
import { EmptyState } from '@/components/EmptyState';
import { listContacts, requestContactsPermission } from '@/services/contacts';
import { attachContact } from '@/db/workouts';
import { setSetting, settingKeys } from '@/db/settings';
import { colors, fontSize, radius, spacing } from '@/theme';
import type { DeviceContact } from '@/types/models';

export default function ContatosScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const numericWorkoutId = Number(workoutId);

  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    const granted = await requestContactsPermission();
    if (!granted) {
      setDenied(true);
      setContacts([]);
      setLoading(false);
      return;
    }

    setContacts(await listContacts(search));
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, search ? 350 : 0);

    return () => clearTimeout(timer);
  }, [load, search]);

  const choose = (contact: DeviceContact) => {
    void (async () => {
      if (Number.isFinite(numericWorkoutId) && numericWorkoutId > 0) {
        await attachContact(numericWorkoutId, contact.id, contact.name);
      }
      await setSetting(settingKeys.lastSharedContact, { id: contact.id, name: contact.name });

      const target = contact.phone ?? contact.email;
      if (!target) return;

      const url = contact.phone
        ? `sms:${encodeURIComponent(target)}`
        : `mailto:${encodeURIComponent(target)}`;

      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      }

      router.back();
    })();
  };

  if (denied) {
    return (
      <View style={styles.centre}>
        <EmptyState
          icon="person-circle-outline"
          title="Contatos indisponíveis"
          description="Precisamos da sua permissão para ler os contatos do aparelho."
        />
        <View style={styles.deniedActions}>
          <AppButton
            label="Abrir ajustes do sistema"
            icon="settings"
            onPress={() => void Linking.openSettings()}
          />
          <AppButton label="Voltar" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome"
          placeholderTextColor={colors.trackPending}
          style={styles.searchInput}
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="people-outline"
              title="Nenhum contato encontrado"
              description="Tente outro termo de busca."
            />
          )
        }
        renderItem={({ item }) => (
          <Text style={styles.contact} onPress={() => choose(item)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.contactBody}>
              <Text style={styles.contactName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.contactDetail} numberOfLines={1}>
                {item.phone ?? item.email ?? ''}
              </Text>
            </View>
            <Ionicons name="paper-plane-outline" size={18} color={colors.brand} />
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centre: { flex: 1, justifyContent: 'center', backgroundColor: colors.background, padding: spacing.lg },
  deniedActions: { gap: spacing.sm },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    marginBottom: 0,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: fontSize.md, color: colors.text },
  list: { padding: spacing.lg, gap: spacing.sm },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.md, fontWeight: '700', color: colors.brand },
  contactBody: { flex: 1, gap: 2 },
  contactName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  contactDetail: { fontSize: fontSize.xs, color: colors.textMuted },
});
