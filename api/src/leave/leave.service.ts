import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Filters } from 'src/ai/interfaces/filter.interface';
import { ContextBuilderService } from 'src/ai/services/context-builder.service';
import { MongoService } from 'src/mongo/mongo.service';
import { LeaveStatus } from 'src/shared/constants/constant';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { QueryLeaveDto } from './dto/query-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { LeaveGateway } from './leave.gateway';

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    private readonly mongo: MongoService,
    private readonly leaveGateway: LeaveGateway,
    private readonly contextBuilder: ContextBuilderService,
  ) {}

  async create(createLeaveDto: CreateLeaveDto, userId: string) {
    const user = await this.mongo.db.collection('users').findOne({
      _id: this.mongo.toObjectId(userId),
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const leaveDoc = {
      title: createLeaveDto.title,
      reason: createLeaveDto.reason || null,
      status: LeaveStatus.PENDING,
      startDate: new Date(createLeaveDto.startDate),
      endDate: new Date(createLeaveDto.endDate || createLeaveDto.startDate),
      userId: user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await this.mongo.db.collection('leaves').insertOne(leaveDoc);
    const leave = await this.mongo.db.collection('leaves').findOne({ _id: res.insertedId });
    if (leave) {
      const u = await this.mongo.db.collection('users').findOne({ _id: leave.userId });
      leave.user = this.mongo.mapDoc(u);
    }

    const mappedLeave = this.mongo.mapDoc(leave);

    this.leaveGateway.emitLeaveCreate(mappedLeave).catch(() => {});

    return { data: mappedLeave, message: 'Leave created successfully' };
  }

  async findAll(query: QueryLeaveDto, userId?: string) {
    const { status, limit = 1000, offset = 0 } = query as any;
    const where: any = {};

    if (status) where.status = status;
    if (userId) where.userId = this.mongo.toObjectId(userId);

    const [rawLeaves, total] = await Promise.all([
      this.mongo.db.collection('leaves')
        .find(where)
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit))
        .toArray(),
      this.mongo.db.collection('leaves').countDocuments(where),
    ]);

    const data = this.mongo.mapDocs(rawLeaves);

    for (const l of data) {
      if (l.userId) {
        const u = await this.mongo.db.collection('users').findOne(
          { _id: l.userId },
          { projection: { name: true, email: true, phone: true } }
        );
        l.user = this.mongo.mapDoc(u);
      }
    }

    return {
      data,
      pagination: { total, limit: Number(limit), offset: Number(offset) },
      message: 'Leaves fetched successfully',
    };
  }

  async findOne(id: string) {
    const leaveCheck = await this.mongo.db.collection('leaves').findOne({
      _id: this.mongo.toObjectId(id),
    });
    if (!leaveCheck) {
      throw new BadRequestException('Leave not found with this id');
    }

    if (leaveCheck.userId) {
      const u = await this.mongo.db.collection('users').findOne({ _id: leaveCheck.userId });
      leaveCheck.user = this.mongo.mapDoc(u);
    }

    return { data: this.mongo.mapDoc(leaveCheck), message: 'Leave fetched successfully' };
  }

  async update(id: string, updateLeaveDto: UpdateLeaveDto) {
    const leaveCheck = await this.mongo.db.collection('leaves').findOne({
      _id: this.mongo.toObjectId(id),
    });
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
      const updateData = {
        ...updateLeaveDto,
        updatedAt: new Date(),
      };

      await this.mongo.db.collection('leaves').updateOne(
        { _id: this.mongo.toObjectId(id) },
        { $set: updateData }
      );

      const data = await this.mongo.db.collection('leaves').findOne({
        _id: this.mongo.toObjectId(id),
      });

      const mappedData = this.mongo.mapDoc(data);

      this.leaveGateway.emitLeaveUpdate(leaveCheck.userId.toString(), mappedData).catch(() => {});

      return { data: mappedData, message: 'Leave updated successfully' };
    }
  }

  async remove(id: string) {
    const leaveCheck = await this.mongo.db.collection('leaves').findOne({
      _id: this.mongo.toObjectId(id),
    });
    if (!leaveCheck) {
      throw new BadRequestException('Leave not found with this id');
    }

    await this.mongo.db.collection('leaves').updateOne(
      { _id: this.mongo.toObjectId(id) },
      {
        $set: {
          status: LeaveStatus.DELETED,
          updatedAt: new Date(),
        },
      }
    );

    const data = await this.mongo.db.collection('leaves').findOne({
      _id: this.mongo.toObjectId(id),
    });

    const mappedData = this.mongo.mapDoc(data);

    this.leaveGateway.emitLeaveUpdate(leaveCheck.userId.toString(), mappedData).catch(() => {});
    return { data: mappedData, message: 'Leave deleted successfully' };
  }

  // AI

  async queryLeaves(filters: Filters) {
    console.log('filter>>>', filters);
    const where = await this.buildWhereClause(filters);

    this.logger.log(`Querying leaves with filters: ${JSON.stringify(where)}`);

    const rawLeaves = await this.mongo.db.collection('leaves')
      .find(where)
      .sort({ createdAt: -1 })
      .toArray();

    const leaves = this.mongo.mapDocs(rawLeaves);
    for (const l of leaves) {
      if (l.userId) {
        const u = await this.mongo.db.collection('users').findOne(
          { _id: l.userId },
          { projection: { name: true, email: true } }
        );
        l.user = this.mongo.mapDoc(u);
      }
    }

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

    const targets = await this.mongo.db.collection('leaves')
      .find(where, { projection: { _id: 1 } })
      .toArray();

    if (targets.length === 0) {
      return {
        updatedCount: 0,
        leaveIds: [],
        message: 'No pending leaves found matching criteria.',
      };
    }

    const ids = targets.map((l) => l._id);

    await this.mongo.db.collection('leaves').updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status: LeaveStatus.APPROVED,
          updatedAt: new Date(),
        },
      }
    );

    // Fetch updated leave records with user info
    const rawUpdatedLeaves = await this.mongo.db.collection('leaves')
      .find({ _id: { $in: ids } })
      .sort({ startDate: 1 })
      .toArray();

    const updatedLeaves = this.mongo.mapDocs(rawUpdatedLeaves);
    for (const l of updatedLeaves) {
      if (l.userId) {
        const u = await this.mongo.db.collection('users').findOne(
          { _id: l.userId },
          { projection: { name: true, email: true } }
        );
        l.user = this.mongo.mapDoc(u);
      }
    }

    const stringIds = ids.map((id) => id.toString());
    this.logger.log(`Approved ${ids.length} leaves: ${stringIds.join(', ')}`);
    return { updatedCount: ids.length, leaveIds: stringIds, leaves: updatedLeaves };
  }

  // ─── Reject Leaves ────────────────────────────────────────────────────────────

  async rejectLeaves(filters: Filters) {
    const where = await this.buildWhereClause(filters);
    where.status = LeaveStatus.PENDING;

    const targets = await this.mongo.db.collection('leaves')
      .find(where, { projection: { _id: 1 } })
      .toArray();

    if (targets.length === 0) {
      return {
        updatedCount: 0,
        leaveIds: [],
        message: 'No pending leaves found matching criteria.',
      };
    }

    const ids = targets.map((l) => l._id);

    await this.mongo.db.collection('leaves').updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status: LeaveStatus.REJECTED,
          updatedAt: new Date(),
        },
      }
    );

    // Fetch updated leave records with user info
    const rawUpdatedLeaves = await this.mongo.db.collection('leaves')
      .find({ _id: { $in: ids } })
      .sort({ startDate: 1 })
      .toArray();

    const updatedLeaves = this.mongo.mapDocs(rawUpdatedLeaves);
    for (const l of updatedLeaves) {
      if (l.userId) {
        const u = await this.mongo.db.collection('users').findOne(
          { _id: l.userId },
          { projection: { name: true, email: true } }
        );
        l.user = this.mongo.mapDoc(u);
      }
    }

    const stringIds = ids.map((id) => id.toString());
    this.logger.log(`Rejected ${ids.length} leaves: ${stringIds.join(', ')}`);
    return { updatedCount: ids.length, leaveIds: stringIds, leaves: updatedLeaves };
  }

  // ─── Cancel Leaves ────────────────────────────────────────────────────────────

  async cancelLeaves(filters: Filters) {
    const where = await this.buildWhereClause(filters);
    where.status = { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] };

    const targets = await this.mongo.db.collection('leaves')
      .find(where, { projection: { _id: 1 } })
      .toArray();

    if (targets.length === 0) {
      return { updatedCount: 0, leaveIds: [] };
    }

    const ids = targets.map((l) => l._id);

    await this.mongo.db.collection('leaves').updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status: LeaveStatus.DELETED,
          updatedAt: new Date(),
        },
      }
    );

    // Fetch updated leave records with user info
    const rawUpdatedLeaves = await this.mongo.db.collection('leaves')
      .find({ _id: { $in: ids } })
      .sort({ startDate: 1 })
      .toArray();

    const updatedLeaves = this.mongo.mapDocs(rawUpdatedLeaves);
    for (const l of updatedLeaves) {
      if (l.userId) {
        const u = await this.mongo.db.collection('users').findOne(
          { _id: l.userId },
          { projection: { name: true, email: true } }
        );
        l.user = this.mongo.mapDoc(u);
      }
    }

    const stringIds = ids.map((id) => id.toString());
    return { updatedCount: ids.length, leaveIds: stringIds, leaves: updatedLeaves };
  }

  // ─── Count Employees On Leave Today ──────────────────────────────────────────

  async getEmployeesOnLeaveToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const rawLeaves = await this.mongo.db.collection('leaves').find({
      status: LeaveStatus.APPROVED,
      startDate: { $lte: endOfDay },
      endDate: { $gte: today },
    }).toArray();

    const leaves = this.mongo.mapDocs(rawLeaves);
    for (const l of leaves) {
      if (l.userId) {
        const u = await this.mongo.db.collection('users').findOne(
          { _id: l.userId },
          { projection: { name: true } }
        );
        l.user = this.mongo.mapDoc(u);
      }
    }

    return leaves;
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
      where._id = { $in: filters.leaveIds.map(id => this.mongo.toObjectId(id)) };
    }

    // User names filter (lookup IDs first)
    if (filters.userNames?.length) {
      const regexes = filters.userNames.map((name) => new RegExp(name, 'i'));
      const users = await this.mongo.db.collection('users').find({
        name: { $in: regexes },
      }).toArray();
      where.userId = { $in: users.map((u) => u._id) };
    }

    // Department filter (lookup user IDs first)
    if (filters.department) {
      const users = await this.mongo.db.collection('users').find({}).toArray();
      where.userId = { $in: users.map((u) => u._id) };
    }

    // Leave type filter
    if (filters.leaveType) {
      where.type = filters.leaveType.toUpperCase();
    }

    // Date filters
    const { startDate, endDate } =
      this.contextBuilder.resolveDateFilters(filters);

    if (startDate && endDate) {
      where.$or = [
        { createdAt: { $gte: startDate, $lte: endDate } },
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
      ];
    } else if (startDate) {
      where.$or = [
        { createdAt: { $gte: startDate } },
        { endDate: { $gte: startDate } },
      ];
    } else if (endDate) {
      where.$or = [
        { createdAt: { $lte: endDate } },
        { startDate: { $lte: endDate } },
      ];
    }

    return where;
  }
}
