import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Filters } from 'src/ai/interfaces/filter.interface';
import { ContextBuilderService } from 'src/ai/services/context-builder.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { LeaveStatus } from 'src/shared/constants/constant';
// import { LeaveStatus } from '@prisma/client';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { QueryLeaveDto } from './dto/query-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { LeaveGateway } from './leave.gateway';

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly leaveGateway: LeaveGateway,
    private readonly contextBuilder: ContextBuilderService,
  ) {}
  async create(createLeaveDto: CreateLeaveDto, userId: string) {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const leave = await this.prisma.client.leave.create({
      data: {
        title: createLeaveDto.title,
        reason: createLeaveDto.reason || null,
        startDate: new Date(createLeaveDto.startDate),
        endDate: new Date(createLeaveDto.endDate || createLeaveDto.startDate),
        userId: user.id,
      },
      include: {
        user: true,
      },
    });

    this.leaveGateway.emitLeaveCreate(leave).catch(() => {});

    return { data: leave, message: 'Leave created successfully' };
  }

  async findAll(query: QueryLeaveDto, userId?: string) {
    const { status, limit = 1000, offset = 0 } = query as any;
    const where: any = {};

    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [data, total] = await Promise.all([
      this.prisma.client.leave.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.client.leave.count({ where }),
    ]);

    return {
      data,
      pagination: { total, limit, offset },
      message: 'Leaves fetched successfully',
    };
  }

  async findOne(id: string) {
    const leaveCheck = await this.prisma.client.leave.findFirst({
      where: { id },
      include: { user: true },
    });
    if (!leaveCheck) {
      throw new BadRequestException('Leave not found with this id');
    }

    return { data: leaveCheck, message: 'Leave fetched successfully' };
  }

  async update(id: string, updateLeaveDto: UpdateLeaveDto) {
    const leaveCheck = await this.prisma.client.leave.findFirst({ where: { id } });
    if (!leaveCheck) {
      throw new BadRequestException('Leave not found with this id');
    }

    if (leaveCheck.status === LeaveStatus.APPROVED) {
      throw new BadRequestException("You can't update approved leave");
    }

    if (leaveCheck.status === LeaveStatus.REJECTED) {
      throw new BadRequestException("You can't update rejected leave");
    }

    if (leaveCheck.status === LeaveStatus.PENDING) {
      const data = await this.prisma.client.leave.update({
        where: { id },
        data: updateLeaveDto,
      });

      this.leaveGateway.emitLeaveUpdate(leaveCheck.userId, data).catch(() => {});

      return { data, message: 'Leave updated successfully' };
    }
  }

  async remove(id: string) {
    const leaveCheck = await this.prisma.client.leave.findFirst({ where: { id } });
    if (!leaveCheck) {
      throw new BadRequestException('Leave not found with this id');
    }

    const data = await this.prisma.client.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.DELETED,
      },
    });
    this.leaveGateway.emitLeaveUpdate(leaveCheck.userId, data).catch(() => {});
    return { data, message: 'Leave deleted successfully' };
  }

  // AI

  async queryLeaves(filters: Filters) {
    console.log('filter>>>', filters);
    const where = await this.buildWhereClause(filters);

    this.logger.log(`Querying leaves with filters: ${JSON.stringify(where)}`);

    const leaves = await this.prisma.client.leave.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      total: leaves.length,
      leaves,
    };
  }

  // ─── Approve Leaves ───────────────────────────────────────────────────────────

  async approveLeaves(filters: Filters) {
    const where = await this.buildWhereClause(filters);

    // Always scope updates to PENDING leaves
    where.status = LeaveStatus.PENDING;

    const targets = await this.prisma.client.leave.findMany({
      where,
      select: { id: true },
    });

    if (targets.length === 0) {
      return {
        updatedCount: 0,
        leaveIds: [],
        message: 'No pending leaves found matching criteria.',
      };
    }

    const ids = targets.map((l) => l.id);

    await this.prisma.client.leave.updateMany({
      where: { id: { in: ids } },
      data: {
        status: LeaveStatus.APPROVED,
      },
    });

    // Fetch updated leave records with user info
    const updatedLeaves = await this.prisma.client.leave.findMany({
      where: { id: { in: ids } },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { startDate: 'asc' },
    });

    this.logger.log(`Approved ${ids.length} leaves: ${ids.join(', ')}`);
    return { updatedCount: ids.length, leaveIds: ids, leaves: updatedLeaves };
  }

  // ─── Reject Leaves ────────────────────────────────────────────────────────────

  async rejectLeaves(filters: Filters) {
    const where = await this.buildWhereClause(filters);
    where.status = LeaveStatus.PENDING;

    const targets = await this.prisma.client.leave.findMany({
      where,
      select: { id: true },
    });

    if (targets.length === 0) {
      return {
        updatedCount: 0,
        leaveIds: [],
        message: 'No pending leaves found matching criteria.',
      };
    }

    const ids = targets.map((l) => l.id);

    await this.prisma.client.leave.updateMany({
      where: { id: { in: ids } },
      data: {
        status: LeaveStatus.REJECTED,
      },
    });

    // Fetch updated leave records with user info
    const updatedLeaves = await this.prisma.client.leave.findMany({
      where: { id: { in: ids } },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { startDate: 'asc' },
    });

    this.logger.log(`Rejected ${ids.length} leaves: ${ids.join(', ')}`);
    return { updatedCount: ids.length, leaveIds: ids, leaves: updatedLeaves };
  }

  // ─── Cancel Leaves ────────────────────────────────────────────────────────────

  async cancelLeaves(filters: Filters) {
    const where = await this.buildWhereClause(filters);
    where.status = { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] } as any;

    const targets = await this.prisma.client.leave.findMany({
      where,
      select: { id: true },
    });

    if (targets.length === 0) {
      return { updatedCount: 0, leaveIds: [] };
    }

    const ids = targets.map((l) => l.id);

    await this.prisma.client.leave.updateMany({
      where: { id: { in: ids } },
      data: { status: LeaveStatus.DELETED },
    });

    // Fetch updated leave records with user info
    const updatedLeaves = await this.prisma.client.leave.findMany({
      where: { id: { in: ids } },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { startDate: 'asc' },
    });

    return { updatedCount: ids.length, leaveIds: ids, leaves: updatedLeaves };
  }

  // ─── Count Employees On Leave Today ──────────────────────────────────────────

  async getEmployeesOnLeaveToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.client.leave.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        startDate: { lte: endOfDay },
        endDate: { gte: today },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  // ─── Private: Build Prisma Where Clause ──────────────────────────────────────

  private async buildWhereClause(
    filters: Filters,
  ): Promise<Record<string, any>> {
    const where: Record<string, any> = {};

    // Status filter
    if (filters.status) {
      const statusMap: Record<
        string,
        (typeof LeaveStatus)[keyof typeof LeaveStatus]
      > = {
        PENDING: LeaveStatus.PENDING,
        APPROVED: LeaveStatus.APPROVED,
        REJECTED: LeaveStatus.REJECTED,
        CANCELLED: LeaveStatus.DELETED,
      };
      const resolved = statusMap[filters.status.toUpperCase()];
      if (resolved) where.status = resolved;
    }

    // Leave IDs filter
    if (filters.leaveIds?.length) {
      where.id = { in: filters.leaveIds };
    }

    // User names filter (lookup IDs first)
    if (filters.userNames?.length) {
      const users = await this.prisma.client.user.findMany({
        where: {
          name: {
            in: filters.userNames,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      });
      where.userId = { in: users.map((u) => u.id) };
    }

    // Department filter (lookup user IDs first)
    if (filters.department) {
      const users = await this.prisma.client.user.findMany({
        select: { id: true },
      });
      where.userId = { in: users.map((u) => u.id) };
    }

    // Leave type filter
    if (filters.leaveType) {
      where.type = filters.leaveType.toUpperCase();
    }

    // Date filters
    const { startDate, endDate } =
      this.contextBuilder.resolveDateFilters(filters);

    if (startDate && endDate) {
      where.OR = [
        { createdAt: { gte: startDate, lte: endDate } },
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ];
    } else if (startDate) {
      where.OR = [
        { createdAt: { gte: startDate } },
        { endDate: { gte: startDate } },
      ];
    } else if (endDate) {
      where.OR = [
        { createdAt: { lte: endDate } },
        { startDate: { lte: endDate } },
      ];
    }

    return where;
  }
}
