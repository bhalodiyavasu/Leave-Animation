// src/analytics/services/analytics.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { LeaveStatus, UserRole } from 'src/shared/constants/constant';
import { PrismaService } from '../../prisma/prisma.service';
import { Filters } from '../interfaces/filter.interface';
import { ContextBuilderService } from './context-builder.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contextBuilder: ContextBuilderService,
  ) {}

  async getLeaveAnalytics(filters: Filters) {
    const { startDate, endDate } =
      this.contextBuilder.resolveDateFilters(filters);

    const dateFilter: Record<string, any> = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const baseWhere: Record<string, any> = hasDateFilter
      ? { createdAt: dateFilter }
      : {};

    const [
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      cancelledLeaves,
      totalUsers,
      usersOnLeaveToday,
    ] = await Promise.all([
      this.prisma.client.leave.count({ where: baseWhere }),
      this.prisma.client.leave.count({
        where: { ...baseWhere, status: LeaveStatus.PENDING },
      }),
      this.prisma.client.leave.count({
        where: { ...baseWhere, status: LeaveStatus.APPROVED },
      }),
      this.prisma.client.leave.count({
        where: { ...baseWhere, status: LeaveStatus.REJECTED },
      }),
      this.prisma.client.leave.count({
        where: { ...baseWhere, status: LeaveStatus.DELETED },
      }),
      this.prisma.client.user.count({ where: { role: { name: UserRole.CUSTOMER } } }),
      this.getUsersOnLeaveTodayCount(),
    ]);

    return {
      summary: {
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        cancelledLeaves,
        totalUsers,
        usersOnLeaveToday,
        approvalRate:
          totalLeaves > 0
            ? Math.round((approvedLeaves / totalLeaves) * 100)
            : 0,
      },
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private async getUsersOnLeaveTodayCount(): Promise<number> {
    const now = new Date();
    const startDay = new Date(now.setHours(0, 0, 0, 0));
    const endDay = new Date(now.setHours(23, 59, 59, 999));

    return this.prisma.client.leave.count({
      where: {
        status: LeaveStatus.APPROVED,
        startDate: { lte: endDay },
        endDate: { gte: startDay },
      },
    });
  }
}
