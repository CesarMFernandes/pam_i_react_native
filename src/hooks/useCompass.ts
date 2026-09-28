import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

type Subscription = { remove: () => void };

export type CompassState = {
  /** graus de 0 a 360, 0 = norte */
  heading: number;
  /** trueHeading é -1 enquanto não houver permissão de localização */
  isTrueHeading: boolean;
  /** 3 = alta, 2 = média, 1 = baixa, 0 = sem sinal */
  accuracy: number;
};

const OFF: CompassState = { heading: 0, isTrueHeading: false, accuracy: 0 };

/**
 * Bússola via `Location.watchHeadingAsync`.
 *
 * SDK 57: `Location.setHeadingUpdateInterval` foi removido e o payload não
 * usa mais `magneticHeading` — o campo é `magHeading`.
 */
export function useCompass(enabled: boolean): CompassState {
  const [reading, setReading] = useState<CompassState>(OFF);

  useEffect(() => {
    if (!enabled) return;

    let subscription: Subscription | null = null;
    let cancelled = false;

    (async () => {
      try {
        const sub = await Location.watchHeadingAsync(
          ({ magHeading, trueHeading, accuracy }) => {
            if (cancelled) return;

            const isTrueHeading = trueHeading >= 0;
            setReading({
              heading: normalizeDegrees(isTrueHeading ? trueHeading : magHeading),
              isTrueHeading,
              accuracy,
            });
          },
          () => {
            // Emulador/simulador sem magnetômetro: mantém o último valor.
          },
        );

        if (cancelled) {
          sub.remove();
        } else {
          subscription = sub;
        }
      } catch {
        // Sem heading disponível neste dispositivo.
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  if (!enabled) return OFF;
  return reading;
}

function normalizeDegrees(value: number): number {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}
