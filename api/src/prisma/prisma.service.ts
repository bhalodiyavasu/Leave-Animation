import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

import { getEnvVar } from '../leave/worker-env.registry';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private _client: any;

  get client() {
    if (!this._client) {
      this._client = new PrismaClient({
        datasourceUrl: getEnvVar('DATABASE_URL'),
      }).$extends(withAccelerate());
    }
    return this._client;
  }

  async onModuleInit() {}

  async onModuleDestroy() {}
}
