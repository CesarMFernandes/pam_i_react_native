import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize } from '@/theme';

type Props = {
  heading: number;
  accuracy: number;
  isTrueHeading: boolean;
  size?: number;
};

const CARDINALS = ['N', 'L', 'S', 'O'];

/** Converte graus para os pontos cardeais em português. */
export function toCardinal(heading: number): string {
  const index = Math.round(heading / 90) % 4;
  return CARDINALS[index];
}

/**
 * Bússola simples: o disco é fixo e a agulha gira na direção em que o
 * aparelho está apontado.
 */
export function CompassDial({ heading, accuracy, isTrueHeading, size = 180 }: Props) {
  const needleRotation = `${-heading}deg`;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.dial, { width: size, height: size, borderRadius: size / 2 }]}>
        {CARDINALS.map((label, index) => (
          <View
            key={label}
            style={[
              styles.marker,
              {
                transform: [{ rotate: `${index * 90}deg` }, { translateY: -size / 2 + 14 }],
              },
            ]}
          >
            <Text style={[styles.markerText, index === 0 && styles.markerNorth]}>{label}</Text>
          </View>
        ))}

        <View style={[styles.needle, { transform: [{ rotate: needleRotation }] }]}>
          <View style={styles.needleNorth} />
          <View style={styles.needleSouth} />
        </View>

        <View style={styles.hub} />
      </View>

      <View style={styles.readout}>
        <Text style={styles.degrees}>{Math.round(heading)}°</Text>
        <Text style={styles.cardinal}>{toCardinal(heading)}</Text>
        <Text style={styles.quality}>
          {accuracy === 0
            ? 'sem sinal'
            : isTrueHeading
              ? 'bússola com localização'
              : 'bússola magnética'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 12 },
  dial: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: { position: 'absolute', alignItems: 'center' },
  markerText: { fontSize: fontSize.md, fontWeight: '700', color: colors.textMuted },
  markerNorth: { color: colors.danger },
  needle: { width: 4, height: '72%', alignItems: 'center' },
  needleNorth: { flex: 1, width: 4, backgroundColor: colors.danger, borderRadius: 2 },
  needleSouth: { flex: 1, width: 4, backgroundColor: colors.trackPending, borderRadius: 2 },
  hub: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text,
  },
  readout: { alignItems: 'center', gap: 2 },
  degrees: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  cardinal: { fontSize: fontSize.md, fontWeight: '600', color: colors.brand },
  quality: { fontSize: fontSize.xs, color: colors.textMuted },
});
