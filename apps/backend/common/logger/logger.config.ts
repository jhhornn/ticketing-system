import { LOGGER_DEFAULTS, LOGGER_ENV_KEYS } from './logger.constants.js';

export interface LoggerEnvironmentContext extends Record<string, unknown> {
  service: string;
  version: string;
  commit_hash: string;
  environment: string;
  region: string;
  hostname: string;
  node_version: string;
}

export function isDevelopmentEnvironment(
  nodeEnv = process.env[LOGGER_ENV_KEYS.nodeEnv],
): boolean {
  return nodeEnv !== 'production';
}

export function resolveLoggerLevel(
  isDevelopment: boolean,
  logLevel = process.env[LOGGER_ENV_KEYS.logLevel],
): string {
  if (logLevel) {
    return logLevel;
  }

  return isDevelopment
    ? LOGGER_DEFAULTS.developmentLogLevel
    : LOGGER_DEFAULTS.productionLogLevel;
}

export function createLoggerEnvironmentContext(
  nodeVersion = process.version,
): LoggerEnvironmentContext {
  return {
    service: LOGGER_DEFAULTS.service,
    version: process.env[LOGGER_ENV_KEYS.appVersion] || LOGGER_DEFAULTS.version,
    commit_hash:
      process.env[LOGGER_ENV_KEYS.gitCommit] || LOGGER_DEFAULTS.commitHash,
    environment:
      process.env[LOGGER_ENV_KEYS.nodeEnv] || LOGGER_DEFAULTS.environment,
    region: process.env[LOGGER_ENV_KEYS.region] || LOGGER_DEFAULTS.region,
    hostname: process.env[LOGGER_ENV_KEYS.hostname] || LOGGER_DEFAULTS.hostname,
    node_version: nodeVersion,
  };
}
