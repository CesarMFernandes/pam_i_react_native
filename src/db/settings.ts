import { getDatabase } from './index';

export type AppSettings = {
  units: 'km' | 'mi';
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  keepScreenOn: boolean;
  lastSharedContact: { id: string; name: string } | null;
};

/** As chaves abaixo são exatamente as colunas da tabela `settings`. */
export const settingKeys: { [K in keyof AppSettings]: K } = {
  units: 'units',
  reminderEnabled: 'reminderEnabled',
  reminderHour: 'reminderHour',
  reminderMinute: 'reminderMinute',
  keepScreenOn: 'keepScreenOn',
  lastSharedContact: 'lastSharedContact',
};

export const defaultSettings: AppSettings = {
  units: 'km',
  reminderEnabled: false,
  reminderHour: 7,
  reminderMinute: 0,
  keepScreenOn: true,
  lastSharedContact: null,
};

export async function getSettings(): Promise<AppSettings> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings',
  );

  const map = new Map<string, string>(rows.map((row) => [row.key, row.value] as const));
  const contact = map.get('lastSharedContact');

  return {
    units: map.get('units') === 'mi' ? 'mi' : 'km',
    reminderEnabled: map.get('reminderEnabled') === 'true',
    reminderHour: Number(map.get('reminderHour') ?? defaultSettings.reminderHour),
    reminderMinute: Number(map.get('reminderMinute') ?? defaultSettings.reminderMinute),
    keepScreenOn: map.get('keepScreenOn') !== 'false',
    lastSharedContact: contact ? (JSON.parse(contact) as AppSettings['lastSharedContact']) : null,
  };
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): Promise<void> {
  const db = await getDatabase();
  const stored = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);

  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES ($key, $value)
     ON CONFLICT(key) DO UPDATE SET value = $value`,
    { $key: key, $value: stored },
  );
}
