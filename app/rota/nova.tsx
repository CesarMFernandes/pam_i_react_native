import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/AppButton';
import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { Pill } from '@/components/Pill';
import { Screen } from '@/components/Screen';
import { createRoute } from '@/db/routes';
import { persistImage } from '@/services/media';
import { colors, fontSize, radius, spacing } from '@/theme';
import type { Difficulty } from '@/types/models';

const DIFFICULTIES: Difficulty[] = ['facil', 'media', 'dificil'];
const LABELS: Record<Difficulty, string> = {
  facil: 'Fácil',
  media: 'Média',
  dificil: 'Difícil',
};

export default function NovaRotaScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('media');
  const [distanceKm, setDistanceKm] = useState('');
  const [elevation, setElevation] = useState('');
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const pickCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        'Precisamos acessar a galeria para escolher a foto da rota.',
      );
      return;
    }

    // SDK 57: mediaTypes é um array de strings ('images'), não mais um enum.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setCoverUri(await persistImage(asset));
  };

  const captureOrigin = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Precisamos da sua localização.');
      return;
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    setOrigin({
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    });
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Dê um nome para a rota.');
      return;
    }

    setSaving(true);
    try {
      const id = await createRoute({
        name: name.trim(),
        description: description.trim() || null,
        difficulty,
        distanceMeters: Number(distanceKm.replace(',', '.')) * 1000 || 0,
        elevationGainMeters: Number(elevation.replace(',', '.')) || 0,
        startLatitude: origin?.latitude ?? null,
        startLongitude: origin?.longitude ?? null,
        coverUri,
      });

      router.replace({ pathname: '/rota/[id]', params: { id: String(id) } });
    } catch (error) {
      Alert.alert(
        'Não foi possível salvar',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
      setSaving(false);
    }
  };

  return (
    <Screen title="Nova rota" subtitle="Descreva o percurso que você quer registrar">
      <Card>
        <FormField
          label="Nome da rota"
          value={name}
          onChangeText={setName}
          placeholder="Ex.: Trilha do Meuco Peixoto"
          autoCapitalize="sentences"
        />

        <FormField
          label="Descrição"
          value={description}
          onChangeText={setDescription}
          placeholder="Observações sobre o percurso"
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />

        <Text style={styles.label}>Dificuldade</Text>
        <View style={styles.chips}>
          {DIFFICULTIES.map((option) => {
            const active = difficulty === option;
            return (
              <Pill
                key={option}
                label={LABELS[option]}
                onPress={() => setDifficulty(option)}
                color={active ? colors.textInverse : colors.brand}
                background={active ? colors.brand : colors.brandSurface}
              />
            );
          })}
        </View>
      </Card>

      <Card title="Medições">
        <View style={styles.row}>
          <View style={styles.half}>
            <FormField
              label="Distância (km)"
              value={distanceKm}
              onChangeText={setDistanceKm}
              placeholder="0,0"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.half}>
            <FormField
              label="Desnível (m)"
              value={elevation}
              onChangeText={setElevation}
              placeholder="0"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <AppButton
          label={origin ? 'Ponto de início definido' : 'Usar minha localização'}
          icon={origin ? 'checkmark-circle' : 'locate'}
          variant={origin ? 'ghost' : 'secondary'}
          size="sm"
          onPress={() => void captureOrigin()}
        />
      </Card>

      <Card title="Foto de capa">
        <Pressable onPress={() => void pickCover()} style={styles.coverPicker}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverEmpty}>
              <Ionicons name="image-outline" size={28} color={colors.textMuted} />
              <Text style={styles.coverText}>Escolher da galeria</Text>
            </View>
          )}
        </Pressable>
      </Card>

      <AppButton
        label="Salvar rota"
        icon="checkmark"
        size="lg"
        disabled={saving}
        onPress={() => void save()}
      />
      <AppButton label="Cancelar" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  chips: { flexDirection: 'row', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  coverPicker: {
    height: 160,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  coverImage: { width: '100%', height: '100%' },
  coverEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  coverText: { fontSize: fontSize.sm, color: colors.textMuted },
});
