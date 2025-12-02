import {
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
  DEFAULT_PERSIST_SKIP_REPORT,
  type RunnerArgs,
  formatSchema,
} from '@code-pushup/models';

export function isCI() {
  return isEnvVarEnabled('CI');
}

export function isEnvVarEnabled(name: string): boolean {
  const value = coerceBooleanValue(process.env[name]);

  if (typeof value === 'boolean') {
    return value;
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

type RUNNER_ARGS_ENV_VAR =
  | 'CP_PERSIST_OUTPUT_DIR'
  | 'CP_PERSIST_FILENAME'
  | 'CP_PERSIST_FORMAT'
  | 'CP_PERSIST_SKIP_REPORTS';

type RunnerEnv = Record<RUNNER_ARGS_ENV_VAR, string>;

const FORMAT_SEP = ',';

export function runnerArgsToEnv(config: RunnerArgs): RunnerEnv {
  return {
    CP_PERSIST_OUTPUT_DIR: config.persist.outputDir,
    CP_PERSIST_FILENAME: config.persist.filename,
    CP_PERSIST_FORMAT: config.persist.format.join(FORMAT_SEP),
    CP_PERSIST_SKIP_REPORTS: config.persist.skipReports.toString(),
  };
}

export function runnerArgsFromEnv(env: Partial<RunnerEnv>): RunnerArgs {
  const formats = env.CP_PERSIST_FORMAT?.split(FORMAT_SEP)
    .map(item => formatSchema.safeParse(item).data)
    .filter(item => item != null);
  const skipReports = coerceBooleanValue(env.CP_PERSIST_SKIP_REPORTS);
  return {
    persist: {
      outputDir: env.CP_PERSIST_OUTPUT_DIR || DEFAULT_PERSIST_OUTPUT_DIR,
      filename: env.CP_PERSIST_FILENAME || DEFAULT_PERSIST_FILENAME,
      format: formats?.length ? formats : DEFAULT_PERSIST_FORMAT,
      skipReports: skipReports ?? DEFAULT_PERSIST_SKIP_REPORT,
    },
  };
}
