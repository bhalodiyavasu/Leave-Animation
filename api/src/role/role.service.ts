import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { MongoService } from 'src/mongo/mongo.service';
import { QueryRoleDto } from './dto/query-role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly mongo: MongoService) {}
  async create(createRoleDto: CreateRoleDto) {
    const roleCheck = await this.mongo.db.collection('roles').findOne({
      name: createRoleDto.name,
    });
    if (roleCheck) {
      throw new BadRequestException('Role already exists with this name');
    }

    const doc = {
      name: createRoleDto.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await this.mongo.db.collection('roles').insertOne(doc);
    const data = { id: result.insertedId.toString(), ...doc };

    return { data, message: 'Role created successfully' };
  }

  async findAll(queryRoleDto: QueryRoleDto) {
    const { name, limit = 10, offset = 0 } = queryRoleDto;
    const where: any = {};

    if (name) {
      where.name = name;
    }

    const [rawDocs, total] = await Promise.all([
      this.mongo.db.collection('roles')
        .find(where)
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit))
        .toArray(),
      this.mongo.db.collection('roles').countDocuments(where),
    ]);

    const data = this.mongo.mapDocs(rawDocs);

    return {
      data,
      pagination: { total, limit: Number(limit), offset: Number(offset) },
      message: 'Roles fetched successfully',
    };
  }

  async findOne(id: string) {
    const roleCheck = await this.mongo.db.collection('roles').findOne({
      _id: this.mongo.toObjectId(id),
    });
    if (!roleCheck) {
      throw new BadRequestException('Role not found with this id');
    }

    return { data: this.mongo.mapDoc(roleCheck), message: 'Role fetched successfully' };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const roleCheck = await this.mongo.db.collection('roles').findOne({
      _id: this.mongo.toObjectId(id),
    });
    if (!roleCheck) {
      throw new BadRequestException('Role not found with this id');
    }

    await this.mongo.db.collection('roles').updateOne(
      { _id: this.mongo.toObjectId(id) },
      { $set: { ...updateRoleDto, updatedAt: new Date() } }
    );

    const updated = await this.mongo.db.collection('roles').findOne({
      _id: this.mongo.toObjectId(id),
    });

    return { data: this.mongo.mapDoc(updated), message: 'Role updated successfully' };
  }

  async remove(id: string) {
    const roleCheck = await this.mongo.db.collection('roles').findOne({
      _id: this.mongo.toObjectId(id),
    });
    if (!roleCheck) {
      throw new BadRequestException('Role not found with this id');
    }

    await this.mongo.db.collection('roles').deleteOne({
      _id: this.mongo.toObjectId(id),
    });

    return { data: this.mongo.mapDoc(roleCheck), message: 'Role deleted successfully' };
  }
}
