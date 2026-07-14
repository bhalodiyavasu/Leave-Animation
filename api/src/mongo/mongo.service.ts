import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { MongoClient, Db, ObjectId } from "mongodb";
import { getEnvVar } from "../leave/worker-env.registry";

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient | null = null;
  private _db: Db | null = null;

  async onModuleInit() {}

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
    }
  }

  get db(): Db {
    if (!this._db) {
      const url = getEnvVar("DATABASE_URL");
      if (!url) {
        throw new Error("DATABASE_URL environment variable is not defined");
      }
      this.client = new MongoClient(url);
      this._db = this.client.db();
    }
    return this._db;
  }

  mapDoc<T = any>(doc: any): T | null {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return { id: _id.toString(), ...rest } as any;
  }

  mapDocs<T = any>(docs: any[]): T[] {
    return docs.map((doc) => this.mapDoc<T>(doc) as T);
  }

  toObjectId(id: string | ObjectId): ObjectId {
    if (id instanceof ObjectId) return id;
    try {
      return new ObjectId(id);
    } catch {
      throw new Error(`Invalid ObjectId: ${id}`);
    }
  }
}
