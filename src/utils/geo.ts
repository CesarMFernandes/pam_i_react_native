import type { LatLng } from '@/types/models';

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Distância entre dois pontos em metros, pela fórmula de Haversine.
 * É uma aproximação da distância sobre a superfície da Terra — para
 * distâncias curtas (percursos de corrida/trilha) o erro é irrelevante.
 */
export function distanceBetween(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);

  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/** Distância acumulada de uma sequência de pontos. */
export function totalDistance(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += distanceBetween(points[i - 1], points[i]);
  }
  return total;
}

/** Diferença de altitude acumulada (ganho de elevação) em metros. */
export function elevationGain(points: (LatLng & { altitude: number | null })[]): number {
  let gain = 0;
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1].altitude;
    const current = points[i].altitude;
    if (previous == null || current == null) continue;

    const delta = current - previous;
    // ignora o ruído do GPS: só conta subidas acima de 1 metro
    if (delta > 1) gain += delta;
  }
  return gain;
}

/** Deslocamento em metros entre a primeira e a última posição. */
export function displacement(points: LatLng[]): number {
  if (points.length < 2) return 0;
  return distanceBetween(points[0], points[points.length - 1]);
}

/** Indica se um novo ponto vale a pena ser gravado (filtra ruído do GPS). */
export function isMeaningfulMove(
  previous: LatLng | null,
  next: LatLng,
  minMeters: number,
): boolean {
  if (!previous) return true;
  return distanceBetween(previous, next) >= minMeters;
}

export const DEFAULT_REGION = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
} as const;
