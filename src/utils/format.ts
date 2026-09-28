const METERS_PER_MILE = 1609.344;

export type UnitSystem = 'km' | 'mi';

function convertMeters(meters: number, units: UnitSystem): number {
  return units === 'mi' ? meters / METERS_PER_MILE : meters / 1000;
}

const unitSuffix = (units: UnitSystem): string => (units === 'mi' ? 'mi' : 'km');

/** 4230 -> "4,23 km" (pt-BR) */
export function formatDistance(meters: number, units: UnitSystem = 'km'): string {
  if (!Number.isFinite(meters) || meters < 0) return '0,00';
  return convertMeters(meters, units).toFixed(2).replace('.', ',');
}

export function distanceWithUnit(meters: number, units: UnitSystem = 'km'): string {
  return `${formatDistance(meters, units)} ${unitSuffix(units)}`;
}

/** Velocidade em m/s -> "5,4 km/h" */
export function formatSpeed(metersPerSecond: number, units: UnitSystem = 'km'): string {
  if (!Number.isFinite(metersPerSecond) || metersPerSecond <= 0) {
    return units === 'mi' ? '0,0 mph' : '0,0 km/h';
  }

  const value =
    units === 'mi' ? metersPerSecond * 2.23694 : metersPerSecond * 3.6;

  return `${value.toFixed(1).replace('.', ',')} ${units === 'mi' ? 'mph' : 'km/h'}`;
}

/** 3725 -> "1h 02m" */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0m';

  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

/** Relógio grande do rastreador: "01:02:35" */
export function formatStopwatch(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe / 60) % 60);
  const seconds = safe % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`;
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(timestamp: number): string {
  return dateFormatter.format(new Date(timestamp));
}

export function formatTime(timestamp: number): string {
  return timeFormatter.format(new Date(timestamp));
}

export function formatDateTime(timestamp: number): string {
  return dateTimeFormatter.format(new Date(timestamp));
}

/** "agora", "há 5 min", "há 2 dias" */
export function formatRelative(timestamp: number): string {
  const diffSeconds = Math.round((Date.now() - timestamp) / 1000);

  if (diffSeconds < 60) return 'agora';

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;

  return formatDate(timestamp);
}

export function formatPace(distanceMeters: number, durationSeconds: number): string {
  if (distanceMeters < 10 || durationSeconds <= 0) return '--';

  const secondsPerKm = durationSeconds / (distanceMeters / 1000);
  if (!Number.isFinite(secondsPerKm)) return '--';

  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}'${String(seconds).padStart(2, '0')}" /km`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
