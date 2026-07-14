import { Injectable } from '@nestjs/common';
import { getWorkerEnv } from './worker-env.registry';

// Mirrors the RPC methods on `LeaveSocketDurableObject` (src/leave/leave-socket.durable-object.ts).
// That file is bundled directly by wrangler from source (see tsconfig.build.json),
// not by `nest build`, so it can't be imported here — this interface is kept in sync by hand.
interface LeaveSocketRpc {
  broadcastLeaveCreate(leave: unknown): Promise<void>;
  broadcastLeaveUpdate(userId: string, leave: unknown): Promise<void>;
}

@Injectable()
export class LeaveGateway {
  private getStub(): LeaveSocketRpc {
    const env = getWorkerEnv();
    const id = env.LEAVE_SOCKET.idFromName('leave-room');
    return env.LEAVE_SOCKET.get(id) as unknown as LeaveSocketRpc;
  }

  async emitLeaveUpdate(userId: string, leave: any) {
    await this.getStub().broadcastLeaveUpdate(userId, leave);
  }

  async emitLeaveCreate(leave: any) {
    await this.getStub().broadcastLeaveCreate(leave);
  }
}
