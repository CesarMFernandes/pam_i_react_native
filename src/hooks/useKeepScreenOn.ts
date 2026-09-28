import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const TAG = 'rota-rn-rastreio';

/**
 * Mantém a tela acesa enquanto `enabled` for verdadeiro.
 *
 * Não usa `useKeepAwake` porque no SDK 57 o hook só aceita uma `tag` string
 * e não pode ser condicionado — aqui a ativação depende de um estado.
 */
export function useKeepScreenOn(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    void activateKeepAwakeAsync(TAG);

    return () => {
      void deactivateKeepAwake(TAG);
    };
  }, [enabled]);
}
