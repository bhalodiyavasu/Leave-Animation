import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { Filters } from "src/ai/interfaces/filter.interface";
import { PrismaService } from "src/prisma/prisma.service";
import { LeaveStatus } from "src/shared/constants/constant";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    const { email, password, roleId } = createUserDto;

    let existRoleId = "";
    if (roleId) {
      const role = await this.prisma.client.role.findFirst({
        where: { id: roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }
      existRoleId = role.id;
    } else {
      let customerRole = await this.prisma.client.role.findFirst({
        where: { name: "Customer" },
      });

      if (!customerRole) {
        customerRole = await this.prisma.client.role.create({
          data: {
            name: "Customer",
          },
        });
      }
      existRoleId = customerRole.id;
    }

    // Check if email already exists
    const existingUserByEmail = await this.prisma.client.user.findFirst({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new BadRequestException("User already exists with this email.");
    }

    // Check if phone already exists
    const existingUserByPhone = await this.prisma.client.user.findFirst({
      where: { phone: createUserDto.phone },
    });

    if (existingUserByPhone) {
      throw new BadRequestException(
        "User already exists with this phone number.",
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.client.user.create({
      data: {
        name: createUserDto.name,
        email: email,
        password: hashedPassword,
        phone: createUserDto.phone,
        roleId: existRoleId,
      },
      include: {
        role: true,
      },
    });

    return { data: user, message: "User registered successfully" };
  }

  async findAll(queryUserDto: QueryUserDto) {
    const { roleId, limit = 10, offset = 0 } = queryUserDto;

    const role = await this.prisma.client.role.findFirst({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const where: { roleId?: string } = {};

    if (roleId) {
      where.roleId = roleId;
    }

    const [result, total] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          role: true,
        },
        omit: {
          password: true,
        },
      }),
      this.prisma.client.user.count({
        where,
      }),
    ]);

    return {
      data: result,
      pagination: {
        total,
        limit,
        offset,
      },
      message: "User list fetched successfully",
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.client.user.findFirst({
      where: { id },
      include: {
        role: true,
      },
      omit: {
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.client.user.findFirst({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.email !== updateUserDto.email) {
      const existingUser = await this.prisma.client.user.findFirst({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException("User already exist with this email.");
      }
    }

    const updatedUser = await this.prisma.client.user.update({
      where: { id },
      data: {
        name: updateUserDto.name,
        email: updateUserDto.email,
        phone: updateUserDto.phone,
        roleId: updateUserDto.roleId,
      },
    });

    return updatedUser;
  }

  // AI

  async queryUsers(filters: Filters) {
    const where: Record<string, any> = {};

    if (filters.userNames?.length) {
      where.name = { in: filters.userNames, mode: "insensitive" };
    }

    const users = await this.prisma.client.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return { total: users.length, users };
  }

  // ─── Users On Leave Today ─────────────────────────────────────────────────

  async queryUsersOnLeaveToday() {
    const today = new Date();
    const startDay = new Date(today.setHours(0, 0, 0, 0));
    const endDay = new Date(today.setHours(23, 59, 59, 999));

    const leavesToday = await this.prisma.client.leave.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        startDate: { lte: endDay },
        endDate: { gte: startDay },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const users = leavesToday.map((l) => l.user);
    return { total: users.length, users };
  }

  // ─── Users Who Created Leave Today ───────────────────────────────────────

  async queryUsersWhoCreatedLeaveToday() {
    const today = new Date();
    const startDay = new Date(today.setHours(0, 0, 0, 0));
    const endDay = new Date(today.setHours(23, 59, 59, 999));

    const leaves = await this.prisma.client.leave.findMany({
      where: {
        createdAt: { gte: startDay, lte: endDay },
      },
      distinct: ["userId"],
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const users = leaves.map((l) => l.user);
    return { total: users.length, users };
  }
}
