import { LOGGER_DEFAULTS, LOGGER_ENV_KEYS } from './logger.constants.js';
import { getDeploymentInfo } from '../config/deployment-info.js';

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
  const deployment = getDeploymentInfo();
  return {
    service: LOGGER_DEFAULTS.service,
    version: deployment.version,
    commit_hash: deployment.commitHash,
    environment: deployment.environment,
    region: deployment.region,
    hostname: deployment.hostname,
    node_version: nodeVersion,
  };
}
