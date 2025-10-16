import ansis from 'ansis';
import cliSpinners from 'cli-spinners';
import logSymbols from 'log-symbols';
import os from 'node:os';
import type { MockInstance } from 'vitest';
import { Logger } from './logger.js';

// customize ora options for test environment
vi.mock('ora', async (): Promise<typeof import('ora')> => {
  const exports = await vi.importActual<typeof import('ora')>('ora');
  return {
    ...exports,
    default: options =>
      exports.default({
        // skip cli-cursor package
        hideCursor: false,
        // skip is-interactive package
        isEnabled: process.env['CI'] !== 'true',
        // preserve other options
        ...(typeof options === 'string' ? { text: options } : options),
      }),
  };
});

describe('Logger', () => {
  let output = '';
  let consoleLogSpy: MockInstance<unknown[], void>;
  let processStderrSpy: MockInstance<[], typeof process.stderr>;
  let performanceNowSpy: MockInstance<[], number>;
  let mathRandomSpy: MockInstance<[], number>;

  beforeAll(() => {
    vi.useFakeTimers();

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(message => {
      output += `${message}\n`;
    });

    // ora spinner uses process.stderr stream
    const mockProcessStderr: Partial<typeof process.stderr> = {
      write: message => {
        output += message;
        return true;
      },
      get isTTY() {
        return process.env['CI'] !== 'true';
      },
      cursorTo: () => true,
      moveCursor: () => true,
      clearLine: () => {
        const idx = output.lastIndexOf('\n');
        output = idx >= 0 ? output.substring(0, idx) : '';
        return true;
      },
    };
    processStderrSpy = vi
      .spyOn(process, 'stderr', 'get')
      .mockReturnValue(mockProcessStderr as typeof process.stderr);
  });

  beforeEach(() => {
    output = '';
    performanceNowSpy = vi.spyOn(performance, 'now');
    mathRandomSpy = vi.spyOn(Math, 'random');

    vi.stubEnv('CI', 'false');
    vi.stubEnv('GITHUB_ACTIONS', 'false');
    vi.stubEnv('GITLAB_CI', 'false');
  });

  afterAll(() => {
    vi.useRealTimers();
    consoleLogSpy.mockReset();
    processStderrSpy.mockReset();
    performanceNowSpy.mockReset();
    mathRandomSpy.mockReset();
  });

  describe('basic usage', () => {
    it('should colorize logs based on level', () => {
      vi.stubEnv('CP_VERBOSE', 'true'); // to render debug log
      const logger = new Logger();

      logger.info('Code PushUp CLI');
      logger.debug('v1.2.3');
      logger.warn('Config file in CommonJS format');
      logger.error('Failed to load config');

      expect(output).toBe(
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

      expect(output).toBe('');
    });

    it('should set verbose flag and environment variable', () => {
      vi.stubEnv('CP_VERBOSE', 'false');
      const logger = new Logger();

      logger.setVerbose(true);

      expect(logger.isVerbose()).toBe(true);
      expect(process.env['CP_VERBOSE']).toBe('true');
      expect(new Logger().isVerbose()).toBe(true);
    });
  });

  describe('groups', () => {
    it('should group logs with symbols and print duration', async () => {
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(1234); // group duration: 1.23 s
      const logger = new Logger();

      await logger.group('Running plugin "ESLint"', async () => {
        logger.info('$ npx eslint . --format=json');
        logger.warn('Skipping unknown rule "deprecation/deprecation"');
        return 'ESLint reported 4 errors and 11 warnings';
      });

      expect(ansis.strip(output)).toBe(`
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
      expect(output).toBe(
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

      expect(output).toBe(
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

      expect(output).toBe(`
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

      expect(ansis.strip(output)).toBe(`
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
      expect(output).toBe(`
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

  describe('spinners', () => {
    beforeEach(() => {
      performanceNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(42); // task duration: 42 ms
    });

    it('should render spinner for async tasks', async () => {
      const task = new Logger().task(
        'Uploading report to portal',
        async () => 'Uploaded report to portal',
      );

      expect(output).toBe(`${ansis.cyan('⠋')} Uploading report to portal`);

      vi.advanceTimersByTime(cliSpinners.dots.interval);
      expect(output).toBe(`${ansis.cyan('⠙')} Uploading report to portal`);

      vi.advanceTimersByTime(cliSpinners.dots.interval);
      expect(output).toBe(`${ansis.cyan('⠹')} Uploading report to portal`);

      await expect(task).resolves.toBeUndefined();

      expect(output).toBe(
        `${logSymbols.success} Uploaded report to portal ${ansis.gray('(42 ms)')}\n`,
      );
    });

    it('should fail spinner if async task rejects', async () => {
      const task = new Logger().task('Uploading report to portal', async () => {
        throw new Error('GraphQL error: Invalid API key');
      });

      expect(output).toBe(`${ansis.cyan('⠋')} Uploading report to portal`);

      await expect(task).rejects.toThrow('GraphQL error: Invalid API key');

      expect(output).toBe(
        `${logSymbols.error} Uploading report to portal → ${ansis.red('Error: GraphQL error: Invalid API key')}\n`,
      );
    });

    it('should skip interactive spinner in CI', async () => {
      vi.stubEnv('CI', 'true');

      const task = new Logger().task(
        'Uploading report to portal',
        async () => 'Uploaded report to portal',
      );

      expect(output).toBe('- Uploading report to portal\n');

      await task;

      expect(output).toBe(
        `
- Uploading report to portal
${logSymbols.success} Uploaded report to portal ${ansis.gray('(42 ms)')}
`.trimStart(),
      );
    });

    it('should fail spinner and exit if SIGINT received', async () => {
      vi.spyOn(process, 'exit').mockReturnValue(undefined as never);
      vi.spyOn(os, 'platform').mockReturnValue('linux');

      new Logger().task(
        'Uploading report to portal',
        async () => 'Uploaded report to portal',
      );

      expect(output).toBe(`${ansis.cyan('⠋')} Uploading report to portal`);

      process.emit('SIGINT');

      expect(output).toBe(
        `
${logSymbols.error} Uploading report to portal ${ansis.red.bold('[SIGINT]')}

${ansis.red.bold('Cancelled by SIGINT')}
`.trimStart(),
      );

      expect(process.exit).toHaveBeenCalledWith(130);
    });

    it('should silence other logs while spinner is running, and print them with indentation after it completes', async () => {
      vi.stubEnv('CP_VERBOSE', 'true');
      const logger = new Logger();

      const task = logger.task('Uploading report to portal', async () => {
        logger.debug('Sent request to Portal API');
        await new Promise(resolve => {
          setTimeout(resolve, 42);
        });
        logger.debug('Received response from Portal API');
        return 'Uploaded report to portal';
      });

      expect(output).toBe(`${ansis.cyan('⠋')} Uploading report to portal`);

      await vi.advanceTimersByTimeAsync(42);
      await expect(task).resolves.toBeUndefined();

      expect(output).toBe(
        `
${logSymbols.success} Uploaded report to portal ${ansis.gray('(42 ms)')}
  ${ansis.gray('Sent request to Portal API')}
  ${ansis.gray('Received response from Portal API')}
`.trimStart(),
      );
    });

    it('should print other logs immediately in CI', async () => {
      vi.stubEnv('CI', 'true');
      vi.stubEnv('CP_VERBOSE', 'true');
      const logger = new Logger();

      logger.task('Uploading report to portal', async () => {
        logger.debug('Sent request to Portal API');
        await new Promise(resolve => {
          setTimeout(resolve, 42);
        });
        logger.debug('Received response from Portal API');
        return 'Uploaded report to portal';
      });

      expect(ansis.strip(output)).toBe(
        `
- Uploading report to portal
  Sent request to Portal API
`.trimStart(),
      );

      await vi.advanceTimersByTimeAsync(42);

      expect(ansis.strip(output)).toBe(
        `
- Uploading report to portal
  Sent request to Portal API
  Received response from Portal API
✔ Uploaded report to portal (42 ms)
`.trimStart(),
      );
    });

    it('should use colored dollar prefix for commands (success)', async () => {
      const command = new Logger().command(
        'npx eslint . --format=json',
        async () => {},
      );

      expect(output).toBe(
        `${ansis.cyan('⠋')} ${ansis.blue('$')} npx eslint . --format=json`,
      );

      await expect(command).resolves.toBeUndefined();

      expect(output).toBe(
        `${logSymbols.success} ${ansis.green('$')} npx eslint . --format=json ${ansis.gray('(42 ms)')}\n`,
      );
    });

    it('should use colored dollar prefix for commands (failure)', async () => {
      const command = new Logger().command(
        'npx eslint . --format=json',
        async () => {
          throw new Error('Process failed with exit code 1');
        },
      );

      expect(output).toBe(
        `${ansis.cyan('⠋')} ${ansis.blue('$')} npx eslint . --format=json`,
      );

      await expect(command).rejects.toThrow('Process failed with exit code 1');

      expect(output).toBe(
        `${logSymbols.error} ${ansis.red('$')} npx eslint . --format=json\n`,
      );
    });
  });
});
