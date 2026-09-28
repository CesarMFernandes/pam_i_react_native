import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

type Subscription = { remove: () => void };

const SHAKE_THRESHOLD = 2.2;
const COOLDOWN_MS = 1_200;
const UPDATE_INTERVAL_MS = 100;

/**
 * Detecta o gesto de "chacoalhar" o aparelho lendo a magnitude do
 * acelerômetro. Usado para marcar um marco no percurso sem tocar na tela.
 *
 * SDK 57: `Accelerometer.watchAcceleration` foi removido; use `addListener`.
 */
export function useShake(enabled: boolean, onShake: () => void): void {
  const handler = useRef(onShake);

  // Mantém o callback atualizado sem precisar re-subscrever o sensor.
  useEffect(() => {
    handler.current = onShake;
  }, [onShake]);

  useEffect(() => {
    if (!enabled) return;

    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
    let lastShakeAt = 0;

    const subscription: Subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      if (magnitude < SHAKE_THRESHOLD) return;

      const now = Date.now();
      if (now - lastShakeAt < COOLDOWN_MS) return;

      lastShakeAt = now;
      handler.current();
    });

    return () => subscription.remove();
  }, [enabled]);
}
