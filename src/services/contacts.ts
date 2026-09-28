import {
  Contact,
  ContactField,
  ContactsSortOrder,
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-contacts';

import type { DeviceContact } from '@/types/models';

export async function hasContactsPermission(): Promise<boolean> {
  const status = await getPermissionsAsync();
  return status.granted;
}

export async function requestContactsPermission(): Promise<boolean> {
  const status = await requestPermissionsAsync();
  return status.granted;
}

/**
 * SDK 57: `expo-contacts` foi reescrito. `getContactsAsync`, `ContactsFields`
 * e `SortTypes` não existem mais — a API nova é baseada na classe `Contact`.
 * A antiga continua disponível em `expo-contacts/legacy`.
 */
export async function listContacts(search = ''): Promise<DeviceContact[]> {
  const granted = await requestContactsPermission();
  if (!granted) return [];

  const details = await Contact.getAllDetails(
    [ContactField.FULL_NAME, ContactField.PHONES, ContactField.EMAILS],
    {
      limit: 200,
      offset: 0,
      sortOrder: ContactsSortOrder.GivenName,
      ...(search.trim() ? { name: search.trim() } : {}),
    },
  );

  return details
    .map((contact) => ({
      id: contact.id,
      name: contact.fullName?.trim() || 'Sem nome',
      phone: contact.phones?.find((phone) => phone.number)?.number ?? null,
      email: contact.emails?.find((email) => email.address)?.address ?? null,
    }))
    .filter((contact) => contact.phone != null || contact.email != null);
}
