import { httpServerHandler } from 'cloudflare:node';
// Imports the `nest build` (tsc/CommonJS) output, not the TS source — Nest's
// decorator-based DI needs `emitDecoratorMetadata`, which esbuild (wrangler's
// bundler) cannot produce. This file and the Durable Object below have no
// decorators, so wrangler bundles them straight from source.
import { bootstrap } from '../dist/src/main';

const ready = bootstrap();
const expressHandler = httpServerHandler({ port: 3030 });

export default {
  async fetch(request, env, ctx) {
    await ready;

    const url = new URL(request.url);
    if (url.pathname.startsWith('/ws/leave')) {
      const id = env.LEAVE_SOCKET.idFromName('leave-room');
      return env.LEAVE_SOCKET.get(id).fetch(request);
    }

    return expressHandler.fetch!(request, env, ctx);
  },
} satisfies ExportedHandler<Cloudflare.Env>;

export { LeaveSocketDurableObject } from './leave/leave-socket.durable-object';
