import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { Filters } from "src/ai/interfaces/filter.interface";
import { MongoService } from "src/mongo/mongo.service";
import { LeaveStatus } from "src/shared/constants/constant";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {
  constructor(private mongo: MongoService) {}
  async create(createUserDto: CreateUserDto) {
    const { email, password, roleId } = createUserDto;

    let existRoleId: any = null;
    if (roleId) {
      const role = await this.mongo.db.collection("roles").findOne({
        _id: this.mongo.toObjectId(roleId),
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }
      existRoleId = role._id;
    } else {
      let customerRole = await this.mongo.db.collection("roles").findOne({
        name: "Customer",
      });

      if (!customerRole) {
        const res = await this.mongo.db.collection("roles").insertOne({
          name: "Customer",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        existRoleId = res.insertedId;
      } else {
        existRoleId = customerRole._id;
      }
    }

    // Check if email already exists
    const existingUserByEmail = await this.mongo.db
      .collection("users")
      .findOne({ email });

    if (existingUserByEmail) {
      throw new BadRequestException("User already exists with this email.");
    }

    // Check if phone already exists
    if (createUserDto.phone) {
      const existingUserByPhone = await this.mongo.db
        .collection("users")
        .findOne({
          phone: createUserDto.phone,
        });

      if (existingUserByPhone) {
        throw new BadRequestException(
          "User already exists with this phone number.",
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userDoc = {
      name: createUserDto.name,
      email: email,
      password: hashedPassword,
      phone: createUserDto.phone || null,
      roleId: existRoleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await this.mongo.db.collection("users").insertOne(userDoc);

    // Fetch user and include role
    const createdUser = await this.mongo.db
      .collection("users")
      .findOne({ _id: res.insertedId });
    if (createdUser) {
      const role = await this.mongo.db
        .collection("roles")
        .findOne({ _id: createdUser.roleId });
      createdUser.role = this.mongo.mapDoc(role);
    }

    return {
      data: this.mongo.mapDoc(createdUser),
      message: "User registered successfully",
    };
  }

  async findAll(queryUserDto: QueryUserDto) {
    const { roleId, limit = 10, offset = 0 } = queryUserDto;

    const where: any = {};
    if (roleId) {
      const role = await this.mongo.db.collection("roles").findOne({
        _id: this.mongo.toObjectId(roleId),
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }
      where.roleId = role._id;
    }

    const [rawUsers, total] = await Promise.all([
      this.mongo.db
        .collection("users")
        .find(where)
        .skip(Number(offset))
        .limit(Number(limit))
        .toArray(),
      this.mongo.db.collection("users").countDocuments(where),
    ]);

    const users = this.mongo.mapDocs(rawUsers);

    // Populate role info and remove password
    for (const u of users) {
      delete u.password;
      if (u.roleId) {
        const role = await this.mongo.db
          .collection("roles")
          .findOne({ _id: u.roleId });
        u.role = this.mongo.mapDoc(role);
      }
    }

    return {
      data: users,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
      message: "User list fetched successfully",
    };
  }

  async findOne(id: string) {
    const user = await this.mongo.db.collection("users").findOne({
      _id: this.mongo.toObjectId(id),
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    delete user.password;
    if (user.roleId) {
      const role = await this.mongo.db
        .collection("roles")
        .findOne({ _id: user.roleId });
      user.role = this.mongo.mapDoc(role);
    }

    return this.mongo.mapDoc(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.mongo.db.collection("users").findOne({
      _id: this.mongo.toObjectId(id),
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.email !== updateUserDto.email) {
      const existingUser = await this.mongo.db.collection("users").findOne({
        email: updateUserDto.email,
      });

      if (existingUser) {
        throw new BadRequestException("User already exist with this email.");
      }
    }

    const updateData: any = {
      name: updateUserDto.name,
      email: updateUserDto.email,
      phone: updateUserDto.phone,
      updatedAt: new Date(),
    };

    if (updateUserDto.roleId) {
      updateData.roleId = this.mongo.toObjectId(updateUserDto.roleId);
    }

    await this.mongo.db
      .collection("users")
      .updateOne({ _id: this.mongo.toObjectId(id) }, { $set: updateData });

    const updatedUser = await this.mongo.db.collection("users").findOne({
      _id: this.mongo.toObjectId(id),
    });

    return this.mongo.mapDoc(updatedUser);
  }

  // AI

  async queryUsers(filters: Filters) {
    const where: Record<string, any> = {};

    if (filters.userNames?.length) {
      where.name = { $in: filters.userNames };
    }

    const rawUsers = await this.mongo.db
      .collection("users")
      .find(where)
      .project({ id: 1, name: 1, email: 1, createdAt: 1 })
      .sort({ name: 1 })
      .toArray();

    return { total: rawUsers.length, users: this.mongo.mapDocs(rawUsers) };
  }

  // ─── Users On Leave Today ─────────────────────────────────────────────────

  async queryUsersOnLeaveToday() {
    const today = new Date();
    const startDay = new Date(today.setHours(0, 0, 0, 0));
    const endDay = new Date(today.setHours(23, 59, 59, 999));

    const leavesToday = await this.mongo.db
      .collection("leaves")
      .find({
        status: LeaveStatus.APPROVED,
        startDate: { $lte: endDay },
        endDate: { $gte: startDay },
      })
      .toArray();

    const users: any[] = [];
    for (const l of leavesToday) {
      const user = await this.mongo.db
        .collection("users")
        .findOne({ _id: l.userId });
      if (user) {
        users.push({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        });
      }
    }

    return { total: users.length, users };
  }

  // ─── Users Who Created Leave Today ───────────────────────────────────────

  async queryUsersWhoCreatedLeaveToday() {
    const today = new Date();
    const startDay = new Date(today.setHours(0, 0, 0, 0));
    const endDay = new Date(today.setHours(23, 59, 59, 999));

    const leaves = await this.mongo.db
      .collection("leaves")
      .find({
        createdAt: { $gte: startDay, $lte: endDay },
      })
      .toArray();

    // Deduplicate by userId
    const userIds = [...new Set(leaves.map((l) => l.userId.toString()))];

    const users: any[] = [];
    for (const userId of userIds) {
      const user = await this.mongo.db
        .collection("users")
        .findOne({ _id: this.mongo.toObjectId(userId) });
      if (user) {
        users.push({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        });
      }
    }

    return { total: users.length, users };
  }
}
