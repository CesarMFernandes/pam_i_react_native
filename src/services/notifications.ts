import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null = null;
let loadFailed = false;

/**
 * Carrega o `expo-notifications` sob demanda.
 *
 * No Expo Go (SDK 53+) o suporte a *push* foi removido e, no Android, a
 * importação do módulo **lança erro**. Como a importação acontece dentro de um
 * `try/catch`, o app continua funcionando: apenas a notificação fica
 * indisponível. Para usar notificação local é preciso um development build
 * (veja a seção 5.4 do README).
 */
function load(): NotificationsModule | null {
  if (cached) return cached;
  if (loadFailed) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
  } catch (error) {
    loadFailed = true;
    console.warn(
      '[notificações] módulo indisponível neste ambiente:',
      (error as Error)?.message ?? error,
      '— use um development build para habilitar.',
    );
    return null;
  }

  return cached;
}

function installHandler(): void {
  const Notifications = load();
  if (!Notifications) return;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn(
      '[notificações] handler não registrado:',
      (error as Error)?.message ?? error,
    );
  }
}

export const REMINDER_CHANNEL_ID = 'lembrete-de-treino';

/** O handler precisa existir antes da primeira notificação em primeiro plano. */
installHandler();

export async function ensureAndroidChannel(): Promise<boolean> {
  const Notifications = load();
  if (!Notifications || Platform.OS !== 'android') return false;

  try {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Lembretes de treino',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0F766E',
    });
    return true;
  } catch {
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = load();
  if (!Notifications) return false;

  await ensureAndroidChannel();

  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return true;

    const asked = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });

    return asked.status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Agenda um lembrete diário. Devolve `null` quando o módulo de notificações não
 * está disponível (por exemplo, um Expo Go desatualizado) — quem chama decide
 * como avisar o usuário.
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  routeName?: string,
): Promise<string | null> {
  const Notifications = load();
  if (!Notifications) return null;

  await ensureAndroidChannel();

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de sair!',
        body: routeName
          ? `Que tal repetir a rota "${routeName}"?`
          : 'Que tal registrar um percurso hoje?',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelDailyReminder(identifier: string | null): Promise<void> {
  const Notifications = load();
  if (!Notifications || !identifier) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // cancelar é melhor-esforço
  }
}

/** Dispara um aviso imediato (ex.: ao finalizar um treino). */
export async function notifyNow(title: string, body: string): Promise<void> {
  const Notifications = load();
  if (!Notifications) return;

  await ensureAndroidChannel();

  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {
    // sem notificação, mas sem quebrar o fluxo do treino
  }
}
