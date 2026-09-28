import { useEffect, useState } from 'react';
import { Pedometer } from 'expo-sensors';

type Subscription = { remove: () => void };

type Reading = { steps: number; available: boolean };

const OFF: Reading = { steps: 0, available: false };

/**
 * Passos acumulados durante a sessão atual.
 *
 * O iOS entrega o total do dia, então o primeiro valor lido vira a linha de
 * base e o hook expõe só a diferença — por isso o contador zera sozinho
 * quando `enabled` vira false e o próximo rastreio começa do zero.
 */
export function usePedometer(enabled: boolean): Reading {
  const [reading, setReading] = useState<Reading>(OFF);

  useEffect(() => {
    if (!enabled) return;

    let subscription: Subscription | null = null;
    let cancelled = false;
    let baseline: number | null = null;

    (async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (cancelled) return;

      setReading((current) => ({ ...current, available: isAvailable }));
      if (!isAvailable) return;

      subscription = Pedometer.watchStepCount(({ steps }) => {
        if (baseline == null) baseline = steps;
        const delta = Math.max(0, steps - baseline);
        setReading((current) => ({ ...current, steps: delta }));
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  if (!enabled) return OFF;
  return reading;
}
