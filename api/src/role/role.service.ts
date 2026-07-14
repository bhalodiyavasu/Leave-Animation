import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryRoleDto } from './dto/query-role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createRoleDto: CreateRoleDto) {
    const roleCheck = await this.prisma.role.findFirst({
      where: { name: createRoleDto.name },
    });
    if (roleCheck) {
      throw new BadRequestException('Role already exists with this name');
    }

    const data = await this.prisma.role.create({
      data: createRoleDto,
    });

    return { data, message: 'Role created successfully' };
  }

  async findAll(queryRoleDto: QueryRoleDto) {
    const { name, limit = 10, offset = 0 } = queryRoleDto;
    const where: any = {};

    if (name) {
      where.name = name;
    }
    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      data,
      pagination: { total, limit, offset },
      message: 'Roles fetched successfully',
    };
  }

  async findOne(id: string) {
    const roleCheck = await this.prisma.role.findFirst({
      where: { id },
    });
    if (!roleCheck) {
      throw new BadRequestException('Role not found with this id');
    }

    return { data: roleCheck, message: 'Role fetched successfully' };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const roleCheck = await this.prisma.role.findFirst({
      where: { id },
    });
    if (!roleCheck) {
      throw new BadRequestException('Role not found with this id');
    }

    const data = await this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
    return { data, message: 'Role updated successfully' };
  }

  async remove(id: string) {
    const roleCheck = await this.prisma.role.findFirst({
      where: { id },
    });
    if (!roleCheck) {
      throw new BadRequestException('Role not found with this id');
    }

    const data = await this.prisma.role.delete({
      where: { id },
    });
    return { data, message: 'Role deleted successfully' };
  }
}
