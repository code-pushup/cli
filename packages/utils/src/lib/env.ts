import { ui } from './logging.js';

export function isCI() {
  return isEnvVarEnabled('CI');
}

export function isVerbose() {
  return isEnvVarEnabled('CP_VERBOSE');
}

export function isEnvVarEnabled(name: string): boolean {
  const value = coerceBooleanValue(process.env[name]);

  if (typeof value === 'boolean') {
    return value;
  }

  if (process.env[name]) {
    ui().logger.warning(
      `Environment variable ${name} expected to be a boolean (true/false/1/0), but received value ${process.env[name]}. Treating it as disabled.`,
    );
  }

  return false;
}

export function coerceBooleanValue(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const booleanValuePairs = [
      ['true', 'false'],
      ['on', 'off'],
      ['yes', 'no'],
    ];
    const lowerCaseValue = value.toLowerCase();
    // eslint-disable-next-line functional/no-loop-statements
    for (const [trueValue, falseValue] of booleanValuePairs) {
      if (lowerCaseValue === trueValue || lowerCaseValue === falseValue) {
        return lowerCaseValue === trueValue;
      }
    }

    const intValue = Number.parseInt(value, 10);
    if (!Number.isNaN(intValue)) {
      return intValue !== 0;
    }
  }

  return undefined;
}
