import { AccountStatus, UserRole } from '@prisma/client';

export interface AdminUserListItem {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  phone: string | null;
  status: AccountStatus;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
}

export interface AdminUserListResponse {
  users: AdminUserListItem[];
  nextCursor: string | null;
}

export interface AdminUserDetailResponse {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  phone: string | null;
  status: AccountStatus;
  role: UserRole;
  isVerified: boolean;
  suspendedUntil: Date | null;
  statusReason: string | null;
  statusChangedAt: Date | null;
  statusChangedById: string | null;
  createdAt: Date;
  activeSessionsCount: number;
  recentAuditLogs: Array<{
    id: string;
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    beforeState: any;
    afterState: any;
    reason: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }>;
}

export interface AdminUserAuditLogItem {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeState: any;
  afterState: any;
  reason: string;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: Date;
  admin?: {
    id: string;
    username: string;
    displayName: string | null;
  };
}

export interface AdminUserAuditLogResponse {
  logs: AdminUserAuditLogItem[];
  nextCursor: string | null;
}

export interface AdminUserMutationResponse {
  id: string;
  status: AccountStatus;
  role: UserRole;
  suspendedUntil: Date | null;
  statusChangedAt: Date | null;
}
