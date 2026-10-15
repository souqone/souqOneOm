export const USER_STATUS_CHANGED = 'user.status.changed';

export interface UserStatusChangedPayload {
  userId: string;
  previousStatus: string;
  status: string;
  suspendedUntil: Date | null;
  at: Date;
}
