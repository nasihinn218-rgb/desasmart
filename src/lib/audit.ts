import { prisma } from './prisma';

export interface AuditLogParams {
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown> | string | null;
}

export async function logAudit(params: AuditLogParams) {
  try {
    const detailsString =
      typeof params.details === 'object' && params.details !== null
        ? JSON.stringify(params.details)
        : params.details || null;

    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        userRole: params.userRole || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        details: detailsString,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
