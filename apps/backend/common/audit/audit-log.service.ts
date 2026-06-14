// src/backend/api/audit/audit-log.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import type { IAuditLogEntry } from '../interfaces/index.js';
import { AuditAction, AuditEntityType } from '../interfaces/index.js';

// Re-export for convenience
export type { IAuditLogEntry };
export { AuditAction, AuditEntityType };

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an audit event for tracking all critical operations
   */
  async log(entry: IAuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: entry.entityType,
          entityId: BigInt(entry.entityId),
          action: entry.action,
          changes: entry.changes ? JSON.stringify(entry.changes) : null,
          performedBy: entry.performedBy,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          ipAddress: entry.ipAddress,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Log to console but don't fail the operation
      console.error('[AuditLog] Failed to create audit log:', error);
    }
  }

  /**
   * Get audit history for an entity
   */
  async getHistory(entityType: string, entityId: number, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId: BigInt(entityId),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get recent activity for a user
   */
  async getUserActivity(userId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: {
        performedBy: userId,
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Search audit logs with filters
   */
  async search(filters: {
    entityType?: string;
    action?: string;
    performedBy?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType: filters.entityType,
        action: filters.action,
        performedBy: filters.performedBy,
        timestamp: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100,
    });
  }
}
