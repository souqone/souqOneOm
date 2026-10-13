/**
 * Strips deprecated legacy contact fields (contactPhone, whatsapp) from DTOs.
 * Ensures legacy mobile/web clients can still submit these fields without triggering
 * class-validator rejection, while guaranteeing that raw contact numbers are never
 * persisted to the database.
 */
export function stripDeprecatedContactFields<T extends Record<string, any>>(dto: T): T {
  if (!dto || typeof dto !== 'object') return dto;
  const clean = { ...dto };
  delete clean.contactPhone;
  delete clean.whatsapp;
  return clean as T;
}
