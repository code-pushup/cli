import {
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_SKIP_REPORT,
} from '@code-pushup/models';
import {
  coerceBooleanValue,
  isEnvVarEnabled,
  runnerArgsFromEnv,
  runnerArgsToEnv,
} from './env.js';

describe('isEnvVarEnabled', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('should consider missing variable disabled', () => {
    vi.stubEnv('CP_VERBOSE', undefined!);
    expect(isEnvVarEnabled('CP_VERBOSE')).toBeFalse();
  });

  it('should consider "true" enabled', () => {
    vi.stubEnv('CP_VERBOSE', 'true');
    expect(isEnvVarEnabled('CP_VERBOSE')).toBeTrue();
  });

  it('should consider "false" disabled', () => {
    vi.stubEnv('CP_VERBOSE', 'false');
    expect(isEnvVarEnabled('CP_VERBOSE')).toBeFalse();
  });

  it('should consider "1" enabled', () => {
    vi.stubEnv('CP_VERBOSE', '1');
    expect(isEnvVarEnabled('CP_VERBOSE')).toBeTrue();
  });

  it('should consider "0" disabled', () => {
    vi.stubEnv('CP_VERBOSE', '0');
    expect(isEnvVarEnabled('CP_VERBOSE')).toBeFalse();
  });
});

describe('coerceBooleanValue', () => {
  it.each([
    [true, true],
    [false, false],
    ['true', true],
    ['false', false],
    ['True', true],
    ['False', false],
    ['TRUE', true],
    ['FALSE', false],
    ['on', true],
    ['off', false],
    ['yes', true],
    ['no', false],
    ['1', true],
    ['0', false],
    ['42', true],
    ['unknown', undefined],
    [null, undefined],
    [undefined, undefined],
  ])('should coerce value %j to %j', (input, expected) => {
    expect(coerceBooleanValue(input)).toBe(expected);
  });
});

describe('runnerArgsToEnv', () => {
  it('should convert runner args object to namespaced environment variables', () => {
    expect(
      runnerArgsToEnv({
        persist: {
          outputDir: '.code-pushup',
          filename: 'report',
          format: ['json', 'md'],
          skipReports: false,
        },
      }),
    ).toEqual({
      CP_PERSIST_OUTPUT_DIR: '.code-pushup',
      CP_PERSIST_FILENAME: 'report',
      CP_PERSIST_FORMAT: 'json,md',
      CP_PERSIST_SKIP_REPORTS: 'false',
    });
  });
});

describe('runnerArgsFromEnv', () => {
  it('should parse environment variables and create runner args object', () => {
    expect(
      runnerArgsFromEnv({
        CP_PERSIST_OUTPUT_DIR: '.code-pushup',
        CP_PERSIST_FILENAME: 'report',
        CP_PERSIST_FORMAT: 'json,md',
        CP_PERSIST_SKIP_REPORTS: 'false',
      }),
    ).toEqual({
      persist: {
        outputDir: '.code-pushup',
        filename: 'report',
        format: ['json', 'md'],
        skipReports: false,
      },
    });
  });

  it('should fallback to defaults instead of empty or invalid values', () => {
    expect(
      runnerArgsFromEnv({
        CP_PERSIST_OUTPUT_DIR: '.code-pushup',
        CP_PERSIST_FILENAME: '',
        CP_PERSIST_FORMAT: 'html',
        CP_PERSIST_SKIP_REPORTS: 'yup',
      }),
    ).toEqual({
      persist: {
        outputDir: '.code-pushup',
        filename: DEFAULT_PERSIST_FILENAME,
        format: DEFAULT_PERSIST_FORMAT,
        skipReports: DEFAULT_PERSIST_SKIP_REPORT,
      },
    });
  });
});
