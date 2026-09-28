import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

import { requestNotificationPermission } from '@/services/notifications';

export type LocationAccess = {
  foreground: boolean;
  background: boolean;
  canAskBackground: boolean;
  loading: boolean;
};

const INITIAL: LocationAccess = {
  foreground: false,
  background: false,
  canAskBackground: true,
  loading: true,
};

async function readLocationAccess(): Promise<LocationAccess> {
  const [foreground, background] = await Promise.all([
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync(),
  ]);

  return {
    foreground: foreground.granted,
    background: background.granted,
    canAskBackground: foreground.granted && !background.granted,
    loading: false,
  };
}

export function useLocationPermissions(): LocationAccess & {
  requestForeground: () => Promise<boolean>;
  requestBackground: () => Promise<boolean>;
} {
  const [state, setState] = useState<LocationAccess>(INITIAL);

  useEffect(() => {
    let cancelled = false;

    readLocationAccess()
      .then((next) => {
        if (!cancelled) setState(next);
      })
      .catch(() => {
        if (!cancelled) setState({ ...INITIAL, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const requestForeground = useCallback(async () => {
    const result = await Location.requestForegroundPermissionsAsync();
    setState(await readLocationAccess());
    return result.granted;
  }, []);

  const requestBackground = useCallback(async () => {
    const result = await Location.requestBackgroundPermissionsAsync();
    setState(await readLocationAccess());
    return result.granted;
  }, []);

  return { ...state, requestForeground, requestBackground };
}

export function useNotificationPermission() {
  const [granted, setGranted] = useState<boolean | null>(null);

  const request = useCallback(async () => {
    const result = await requestNotificationPermission();
    setGranted(result);
    return result;
  }, []);

  return { granted, request };
}
