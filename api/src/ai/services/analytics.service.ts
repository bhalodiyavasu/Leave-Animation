import { Injectable, Logger } from '@nestjs/common';
import { LeaveStatus, UserRole } from 'src/shared/constants/constant';
import { MongoService } from 'src/mongo/mongo.service';
import { Filters } from '../interfaces/filter.interface';
import { ContextBuilderService } from './context-builder.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly mongo: MongoService,
    private readonly contextBuilder: ContextBuilderService,
  ) {}

  async getLeaveAnalytics(filters: Filters) {
    const { startDate, endDate } =
      this.contextBuilder.resolveDateFilters(filters);

    const dateFilter: Record<string, any> = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const baseWhere: Record<string, any> = hasDateFilter
      ? { createdAt: dateFilter }
      : {};

    const customerRole = await this.mongo.db.collection('roles').findOne({ name: UserRole.CUSTOMER });
    const userWhere = customerRole ? { roleId: customerRole._id } : {};

    const [
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      cancelledLeaves,
      totalUsers,
      usersOnLeaveToday,
    ] = await Promise.all([
      this.mongo.db.collection('leaves').countDocuments(baseWhere),
      this.mongo.db.collection('leaves').countDocuments({ ...baseWhere, status: LeaveStatus.PENDING }),
      this.mongo.db.collection('leaves').countDocuments({ ...baseWhere, status: LeaveStatus.APPROVED }),
      this.mongo.db.collection('leaves').countDocuments({ ...baseWhere, status: LeaveStatus.REJECTED }),
      this.mongo.db.collection('leaves').countDocuments({ ...baseWhere, status: LeaveStatus.DELETED }),
      this.mongo.db.collection('users').countDocuments(userWhere),
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

    return this.mongo.db.collection('leaves').countDocuments({
      status: LeaveStatus.APPROVED,
      startDate: { $lte: endDay },
      endDate: { $gte: startDay },
    });
  }
}
