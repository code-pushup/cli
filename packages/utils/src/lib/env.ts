import { ui } from './logging.js';

export function isVerbose() {
  return isEnvVarEnabled('CP_VERBOSE');
}

export function isEnvVarEnabled(name: string): boolean {
  const value = process.env[name];

  if (!value) {
    return false;
  }

  if (value.toLowerCase() === 'true') {
    return true;
  }

  const int = Number.parseInt(value, 10);
  if (!Number.isNaN(int) && int !== 0) {
    return true;
  }

  ui().logger.warning(
    `Environment variable ${name} expected to be a boolean (true/false/1/0), but received value ${value}. Treating it as disabled.`,
  );

  return false;
}
