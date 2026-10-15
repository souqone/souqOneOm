export interface AdminAuditEntry {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  reason: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}
