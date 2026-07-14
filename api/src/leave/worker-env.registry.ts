// `worker.ts` is the only file that may `import ... from 'cloudflare:workers'` —
// it's bundled fresh as an ES module by wrangler. Everything Nest compiles goes
// through `nest build`'s CommonJS output, where a `require('cloudflare:workers')`
// would be a *dynamic* require the Workers runtime refuses at deploy time. This
// registry lets worker.ts hand the (request-stable) bindings to Nest services
// without any of them importing `cloudflare:workers` themselves.
let currentEnv: Cloudflare.Env | undefined;

export function setWorkerEnv(env: Cloudflare.Env) {
  currentEnv = env;
}

export function getWorkerEnv(): Cloudflare.Env {
  if (!currentEnv) {
    throw new Error('Worker env has not been set yet');
  }
  return currentEnv;
}

export function getEnvVar(key: string): any {
  try {
    const env = getWorkerEnv();
    if (env && (env as any)[key]) {
      return (env as any)[key];
    }
  } catch {
    // Fallback
  }
  return process.env[key];
}
