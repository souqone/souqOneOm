/**
 * Jest manual mock for expo-server-sdk.
 *
 * expo-server-sdk ships as pure ESM and uses import.meta.url, which
 * cannot execute inside Jest's CommonJS environment. This stub replicates
 * only the surface area used by ExpoPushService so all unit tests pass
 * without requiring the real SDK at test time.
 *
 * The real SDK is used at runtime — this file is ONLY loaded by Jest.
 */

export const Expo = jest.fn().mockImplementation(() => ({
  chunkPushNotifications: jest.fn((messages: any[]) => [messages]),
  sendPushNotificationsAsync: jest.fn().mockResolvedValue([]),
}));

// Static method — must be on the constructor function itself
(Expo as any).isExpoPushToken = jest.fn(
  (token: string) => typeof token === 'string' && token.startsWith('ExponentPushToken['),
);

export type ExpoPushMessage = {
  to: string | string[];
  sound?: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  priority?: string;
};

export type ExpoPushTicket =
  | { status: 'ok'; id: string }
  | { status: 'error'; message: string; details?: { error?: string } };
