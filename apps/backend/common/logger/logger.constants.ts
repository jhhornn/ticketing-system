export const LOGGER_DEFAULTS = {
  service: 'ticketing-api',
  version: 'dev',
  commitHash: 'unknown',
  environment: 'development',
  region: 'local',
  hostname: 'localhost',
  developmentLogLevel: 'debug',
  productionLogLevel: 'info',
} as const;

export const LOGGER_ENV_KEYS = {
  appVersion: 'APP_VERSION',
  gitCommit: 'GIT_COMMIT',
  nodeEnv: 'NODE_ENV',
  region: 'REGION',
  hostname: 'HOSTNAME',
  logLevel: 'LOG_LEVEL',
} as const;
