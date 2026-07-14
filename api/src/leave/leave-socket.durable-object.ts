import { DurableObject } from "cloudflare:workers";

interface LeaveSocketAttachment {
  userId?: string;
  role?: string;
}

export class LeaveSocketDurableObject extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") ?? undefined;
    const role = url.searchParams.get("role") ?? undefined;

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const tags: string[] = [];
    if (userId) tags.push(`user_${userId}`);
    if (role === "Admin") tags.push("admins");

    this.ctx.acceptWebSocket(server, tags);
    server.serializeAttachment({
      userId,
      role,
    } satisfies LeaveSocketAttachment);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ) {
    if (!wasClean) {
      ws.close(code, reason);
    }
  }

  async webSocketMessage() {
    // Server -> client push only; no client-originated events today.
  }

  async broadcastLeaveCreate(leave: unknown) {
    const payload = JSON.stringify({ type: "leaveCreate", data: leave });
    for (const ws of this.ctx.getWebSockets("admins")) {
      ws.send(payload);
    }
  }

  async broadcastLeaveUpdate(userId: string, leave: unknown) {
    const payload = JSON.stringify({ type: "leaveUpdate", data: leave });
    for (const ws of this.ctx.getWebSockets(`user_${userId}`)) {
      ws.send(payload);
    }
    for (const ws of this.ctx.getWebSockets("admins")) {
      ws.send(payload);
    }
  }
}
