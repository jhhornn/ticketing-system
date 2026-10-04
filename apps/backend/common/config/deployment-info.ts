import { hostname as osHostname } from 'node:os';

/**
 * Where and what is running, attached to every log, trace and metric.
 *
 * Each value is resolved from the first source that is set:
 *
 *   version      APP_VERSION → npm_package_version (set by pnpm/npm scripts) → 'dev'
 *   commitHash   GIT_COMMIT  → RENDER_GIT_COMMIT (set by Render)            → 'unknown'
 *   hostname     HOSTNAME    → RENDER_INSTANCE_ID (set by Render)           → os.hostname()
 *   region       REGION      → 'local'  (Render has no region variable — set REGION yourself)
 *   environment  NODE_ENV    → 'development'
 *
 * NOTE: Plain module (no Nest imports) so instrumentation.ts can use it before
 * the app boots.
 */
export interface DeploymentInfo {
  version: string;
  commitHash: string;
  environment: string;
  region: string;
  hostname: string;
}

/**
 * dotenv does not expand shell syntax, so a `.env` line like
 * `GIT_COMMIT=${GIT_COMMIT:-unknown}` arrives as that literal string.
 * Treat such placeholders as unset rather than reporting them.
 */
const UNEXPANDED_PLACEHOLDER = /^\$\{.*\}$/;

function firstSet(
  env: NodeJS.ProcessEnv,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value && !UNEXPANDED_PLACEHOLDER.test(value)) {
      return value;
    }
  }
  return undefined;
}

export function getDeploymentInfo(
  env: NodeJS.ProcessEnv = process.env,
): DeploymentInfo {
  return {
    version: firstSet(env, 'APP_VERSION', 'npm_package_version') ?? 'dev',
    commitHash: firstSet(env, 'GIT_COMMIT', 'RENDER_GIT_COMMIT') ?? 'unknown',
    environment: firstSet(env, 'NODE_ENV') ?? 'development',
    region: firstSet(env, 'REGION') ?? 'local',
    hostname:
      firstSet(env, 'HOSTNAME', 'RENDER_INSTANCE_ID') ?? safeOsHostname(),
  };
}

function safeOsHostname(): string {
  try {
    return osHostname() || 'localhost';
  } catch {
    return 'localhost';
  }
}
