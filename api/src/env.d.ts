/// <reference types="@cloudflare/workers-types" />

// Deliberately untyped as `DurableObjectNamespace` (no generic parameter) rather
// than importing the `LeaveSocketDurableObject` class here: that file is excluded
// from `nest build` (see tsconfig.build.json) so wrangler can bundle it directly
// from source as an ES module, and importing its type here would pull it back
// into the CommonJS Nest compilation. `leave.gateway.ts` casts the stub locally
// to get RPC method types.
declare global {
  namespace Cloudflare {
    interface Env {
      LEAVE_SOCKET: DurableObjectNamespace;
    }
  }
}

export {};
