import ansis from 'ansis';
import type { MockInstance } from 'vitest';
import { Logger } from './logger.js';

describe('Logger', () => {
  let stdout = '';
  let consoleLogSpy: MockInstance<unknown[], void>;
  let performanceNowSpy: MockInstance<[], number>;
  let mathRandomSpy: MockInstance<[], number>;

  beforeAll(() => {
    vi.useFakeTimers();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(message => {
      stdout += `${message}\n`;
    });
  });

  beforeEach(() => {
    stdout = '';
    performanceNowSpy = vi.spyOn(performance, 'now');
    mathRandomSpy = vi.spyOn(Math, 'random');

    vi.stubEnv('CI', 'false');
    vi.stubEnv('GITHUB_ACTIONS', 'false');
    vi.stubEnv('GITLAB_CI', 'false');
  });

  afterAll(() => {
    vi.useRealTimers();
    consoleLogSpy.mockReset();
    performanceNowSpy.mockReset();
    mathRandomSpy.mockReset();
  });

  it('should colorize logs based on level', () => {
    vi.stubEnv('CP_VERBOSE', 'true'); // to render debug log
    const logger = new Logger();

    logger.info('Code PushUp CLI');
    logger.debug('v1.2.3');
    logger.warn('Config file in CommonJS format');
    logger.error('Failed to load config');

    expect(stdout).toBe(
      `
Code PushUp CLI
${ansis.gray('v1.2.3')}
${ansis.yellow('Config file in CommonJS format')}
${ansis.red('Failed to load config')}
`.trimStart(),
    );
  });

  it('should omit debug logs if not verbose', () => {
    vi.stubEnv('CP_VERBOSE', 'false');

    new Logger().debug('Found config file code-pushup.config.js');

    expect(stdout).toBe('');
  });

  it('should set verbose flag and environment variable', () => {
    vi.stubEnv('CP_VERBOSE', 'false');
    const logger = new Logger();

    logger.setVerbose(true);

    expect(logger.isVerbose()).toBe(true);
    expect(process.env['CP_VERBOSE']).toBe('true');
    expect(new Logger().isVerbose()).toBe(true);
  });

  it('should group logs with symbols and print duration', async () => {
    performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(1234); // group duration: 1.23 s
    const logger = new Logger();

    await logger.group('Running plugin "ESLint"', async () => {
      logger.info('$ npx eslint . --format=json');
      logger.warn('Skipping unknown rule "deprecation/deprecation"');
      return 'ESLint reported 4 errors and 11 warnings';
    });

    expect(ansis.strip(stdout)).toBe(`
❯ Running plugin "ESLint"
│ $ npx eslint . --format=json
│ Skipping unknown rule "deprecation/deprecation"
└ ESLint reported 4 errors and 11 warnings (1.23 s)

`);
  });

  it('should complete group logs when error is thrown', async () => {
    const logger = new Logger();

    await expect(
      logger.group('Running plugin "ESLint"', async () => {
        logger.info(
          '$ npx eslint . --format=json --output-file=.code-pushup/eslint/results.json',
        );
        throw new Error(
          "ENOENT: no such file or directory, open '.code-pushup/eslint/results.json'",
        );
      }),
    ).rejects.toThrow(
      "ENOENT: no such file or directory, open '.code-pushup/eslint/results.json'",
    );
    expect(stdout).toBe(
      `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('│')} $ npx eslint . --format=json --output-file=.code-pushup/eslint/results.json
${ansis.cyan('└')} ${ansis.red("Error: ENOENT: no such file or directory, open '.code-pushup/eslint/results.json'")}

`,
    );
  });

  it('should alternate colors for log groups and preserve child log styles', async () => {
    performanceNowSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1234) // 1st group duration: 1.23 s
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(12_000) // 2nd group duration: 12 s
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(42); // 3rd group duration: 42 ms
    const logger = new Logger();

    await logger.group('Running plugin "ESLint"', async () => {
      logger.info(`${ansis.blue('$')} npx eslint . --format=json`);
      logger.warn('Skipping unknown rule "deprecation/deprecation"');
      return 'ESLint reported 4 errors and 11 warnings';
    });

    await logger.group(
      'Running plugin "Lighthouse"',
      async () => 'Calculated Lighthouse scores for 4 categories',
    );

    await logger.group('Running plugin "Code coverage"', async () => {
      logger.info(`${ansis.blue('$')} npx vitest --coverage.enabled`);
      return `Total line coverage is ${ansis.bold('82%')}`;
    });

    expect(stdout).toBe(
      `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('│')} ${ansis.blue('$')} npx eslint . --format=json
${ansis.cyan('│')} ${ansis.yellow('Skipping unknown rule "deprecation/deprecation"')}
${ansis.cyan('└')} ${ansis.green('ESLint reported 4 errors and 11 warnings')} ${ansis.gray('(1.23 s)')}

${ansis.bold.magenta('❯ Running plugin "Lighthouse"')}
${ansis.magenta('└')} ${ansis.green('Calculated Lighthouse scores for 4 categories')} ${ansis.gray('(12 s)')}

${ansis.bold.cyan('❯ Running plugin "Code coverage"')}
${ansis.cyan('│')} ${ansis.blue('$')} npx vitest --coverage.enabled
${ansis.cyan('└')} ${ansis.green(`Total line coverage is ${ansis.bold('82%')}`)} ${ansis.gray('(42 ms)')}

`,
    );
  });

  it('should use log group prefix in child loggers', async () => {
    performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(1234); // group duration: 1.23 s

    await new Logger().group('Running plugin "ESLint"', async () => {
      new Logger().info(`${ansis.blue('$')} npx eslint . --format=json`);
      return 'ESLint reported 4 errors and 11 warnings';
    });

    expect(stdout).toBe(`
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('│')} ${ansis.blue('$')} npx eslint . --format=json
${ansis.cyan('└')} ${ansis.green('ESLint reported 4 errors and 11 warnings')} ${ansis.gray('(1.23 s)')}

`);
  });

  it('should use workflow commands to group logs in GitHub Actions environment', async () => {
    vi.stubEnv('CI', 'true');
    vi.stubEnv('GITHUB_ACTIONS', 'true');
    performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(1234); // group duration: 1.23 s
    const logger = new Logger();

    await logger.group('Running plugin "ESLint"', async () => {
      logger.info('$ npx eslint . --format=json');
      logger.warn('Skipping unknown rule "deprecation/deprecation"');
      return 'ESLint reported 4 errors and 11 warnings';
    });

    expect(ansis.strip(stdout)).toBe(`
::group::Running plugin "ESLint"
│ $ npx eslint . --format=json
│ Skipping unknown rule "deprecation/deprecation"
└ ESLint reported 4 errors and 11 warnings (1.23 s)
::endgroup::

`);
  });

  it('should use collapsible sections in GitLab CI/CD environment, initial collapse depends on verbosity', async () => {
    vi.stubEnv('CI', 'true');
    vi.stubEnv('GITLAB_CI', 'true');
    vi.setSystemTime(new Date(123456789000)); // current Unix timestamp: 123456789 seconds since epoch
    performanceNowSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(123) // 1st group duration: 123 ms
      .mockReturnValueOnce(0)
      .mockReturnValue(45); // 2nd group duration: 45 ms
    mathRandomSpy
      .mockReturnValueOnce(0x1a / Math.pow(2, 8)) // 1st group's random ID: "1a"
      .mockReturnValueOnce(0x1b / Math.pow(2, 8)); // 2nd group's random ID: "1b"
    const logger = new Logger();

    logger.setVerbose(false);
    await logger.group('Running plugin "ESLint"', async () => {
      logger.info(`${ansis.blue('$')} npx eslint . --format=json`);
      logger.warn('Skipping unknown rule "deprecation/deprecation"');
      return 'ESLint reported 4 errors and 11 warnings';
    });
    logger.setVerbose(true);
    await logger.group('Running plugin "Code coverage"', async () => {
      logger.info(`${ansis.blue('$')} npx vitest --coverage.enabled`);
      return `Total line coverage is ${ansis.bold('82%')}`;
    });

    // debugging tip: temporarily remove '\r' character from original implementation
    expect(stdout).toBe(`
\x1b[0Ksection_start:123456789:code_pushup_logs_group_1a[collapsed=true]\r\x1b[0K${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('│')} ${ansis.blue('$')} npx eslint . --format=json
${ansis.cyan('│')} ${ansis.yellow('Skipping unknown rule "deprecation/deprecation"')}
${ansis.cyan('└')} ${ansis.green('ESLint reported 4 errors and 11 warnings')} ${ansis.gray('(123 ms)')}
\x1b[0Ksection_end:123456789:code_pushup_logs_group_1a\r\x1b[0K

\x1b[0Ksection_start:123456789:code_pushup_logs_group_1b\r\x1b[0K${ansis.bold.magenta('❯ Running plugin "Code coverage"')}
${ansis.magenta('│')} ${ansis.blue('$')} npx vitest --coverage.enabled
${ansis.magenta('└')} ${ansis.green(`Total line coverage is ${ansis.bold('82%')}`)} ${ansis.gray('(45 ms)')}
\x1b[0Ksection_end:123456789:code_pushup_logs_group_1b\r\x1b[0K

`);
  });
});
