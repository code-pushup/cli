import ansis from 'ansis';
import cliSpinners from 'cli-spinners';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import type { MockInstance } from 'vitest';
import { Logger } from './logger.js';

// customize ora options for test environment
vi.mock('ora', async (): Promise<typeof import('ora')> => {
  const exports = await vi.importActual<typeof import('ora')>('ora');
  return {
    ...exports,
    default: options => {
      const spinner = exports.default({
        // skip cli-cursor package
        hideCursor: false,
        // skip is-interactive package
        isEnabled: process.env['CI'] !== 'true',
        // skip is-unicode-supported package
        spinner: cliSpinners.dots,
        // preserve other options
        ...(typeof options === 'string' ? { text: options } : options),
      });
      // skip log-symbols package
      vi.spyOn(spinner, 'succeed').mockImplementation(text =>
        spinner.stopAndPersist({ text, symbol: ansis.green('✔') }),
      );
      vi.spyOn(spinner, 'fail').mockImplementation(text =>
        spinner.stopAndPersist({ text, symbol: ansis.red('✖') }),
      );
      return spinner;
    },
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
        output = idx >= 0 ? output.substring(0, idx + 1) : '';
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

    it('should print debug logs if not verbose but force flag is used', () => {
      vi.stubEnv('CP_VERBOSE', 'false');

      new Logger().debug('Found config file code-pushup.config.js', {
        force: true,
      });

      expect(output).toBe(
        `${ansis.gray('Found config file code-pushup.config.js')}\n`,
      );
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
${ansis.cyan('└')} ${ansis.red("ENOENT: no such file or directory, open '.code-pushup/eslint/results.json'")}

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

    it('should return result from worker', async () => {
      const result = { stats: { errors: 0, warnings: 0 }, problems: [] };

      await expect(
        new Logger().group('Running plugin "ESLint"', async () => ({
          message: 'Completed "ESLint" plugin execution',
          result,
        })),
      ).resolves.toBe(result);

      expect(output).toContain('Completed "ESLint" plugin execution');
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

    it('should render dots spinner for async tasks', async () => {
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
        `${ansis.green('✔')} Uploaded report to portal ${ansis.gray('(42 ms)')}\n`,
      );
    });

    it('should fail spinner if async task rejects', async () => {
      const task = new Logger().task('Uploading report to portal', async () => {
        throw new Error('GraphQL error: Invalid API key');
      });

      expect(output).toBe(`${ansis.cyan('⠋')} Uploading report to portal`);

      await expect(task).rejects.toThrow('GraphQL error: Invalid API key');

      expect(output).toBe(
        `${ansis.red('✖')} Uploading report to portal → ${ansis.red('GraphQL error: Invalid API key')}\n`,
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
${ansis.green('✔')} Uploaded report to portal ${ansis.gray('(42 ms)')}
`.trimStart(),
      );
    });

    it('should allow spinners to be run in sequence', async () => {
      performanceNowSpy
        .mockReset()
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(30_000) // 1st task duration: 30 s
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1_000); // 2nd task duration: 1 s

      const task1 = new Logger().task(
        'Collecting report',
        async () => 'Collected report',
      );

      expect(output).toBe(`${ansis.cyan('⠋')} Collecting report`);

      await expect(task1).resolves.toBeUndefined();

      expect(output).toBe(
        `${ansis.green('✔')} Collected report ${ansis.gray('(30 s)')}\n`,
      );

      const task2 = new Logger().task(
        'Uploading report to portal',
        async () => 'Uploaded report to portal',
      );

      expect(output).toBe(
        `
${ansis.green('✔')} Collected report ${ansis.gray('(30 s)')}
${ansis.cyan('⠋')} Uploading report to portal`.trimStart(),
      );

      await expect(task2).resolves.toBeUndefined();

      expect(output).toBe(
        `
${ansis.green('✔')} Collected report ${ansis.gray('(30 s)')}
${ansis.green('✔')} Uploaded report to portal ${ansis.gray('(1 s)')}
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
${ansis.red('✖')} Uploading report to portal ${ansis.red.bold('[SIGINT]')}

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
${ansis.green('✔')} Uploaded report to portal ${ansis.gray('(42 ms)')}
  ${ansis.gray('Sent request to Portal API')}
  ${ansis.gray('Received response from Portal API')}
`.trimStart(),
      );
    });

    it('should print other logs once spinner fails', async () => {
      vi.stubEnv('CP_VERBOSE', 'true');
      const logger = new Logger();

      const task = logger.task('Uploading report to portal', async () => {
        logger.debug('Sent request to Portal API');
        await new Promise(resolve => {
          setTimeout(resolve, 42);
        });
        logger.debug('Received response from Portal API');
        throw new Error('GraphQL error: Invalid API key');
      });

      expect(output).toBe(`${ansis.cyan('⠋')} Uploading report to portal`);

      vi.advanceTimersByTime(42);
      await expect(task).rejects.toThrow('GraphQL error: Invalid API key');

      expect(output).toBe(
        `
${ansis.red('✖')} Uploading report to portal → ${ansis.red('GraphQL error: Invalid API key')}
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
        async () => ({ code: 0 }),
      );

      expect(output).toBe(
        `${ansis.cyan('⠋')} ${ansis.blue('$')} npx eslint . --format=json`,
      );

      await expect(command).resolves.toEqual({ code: 0 });

      expect(output).toBe(
        `${ansis.green('✔')} ${ansis.green('$')} npx eslint . --format=json ${ansis.gray('(42 ms)')}\n`,
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
        `${ansis.red('✖')} ${ansis.red('$')} npx eslint . --format=json\n`,
      );
    });

    it("should print command's working directory if it differs from `process.cwd()`", async () => {
      const command = new Logger().command(
        'npx eslint . --format=json',
        async () => {},
        { cwd: 'src' },
      );

      expect(output).toBe(
        `${ansis.cyan('⠋')} ${ansis.blue('src')} ${ansis.blue('$')} npx eslint . --format=json`,
      );

      await expect(command).resolves.toBeUndefined();

      expect(output).toBe(
        `${ansis.green('✔')} ${ansis.blue('src')} ${ansis.green('$')} npx eslint . --format=json ${ansis.gray('(42 ms)')}\n`,
      );
    });

    it('should print relative working directory if absoluted path provided', async () => {
      const command = new Logger().command(
        'npx eslint . --format=json',
        async () => {},
        { cwd: path.join(process.cwd(), 'src') },
      );

      expect(output).toBe(
        `${ansis.cyan('⠋')} ${ansis.blue('src')} ${ansis.blue('$')} npx eslint . --format=json`,
      );

      await expect(command).resolves.toBeUndefined();

      expect(output).toBe(
        `${ansis.green('✔')} ${ansis.blue('src')} ${ansis.green('$')} npx eslint . --format=json ${ansis.gray('(42 ms)')}\n`,
      );
    });
  });

  describe('spinners + groups', () => {
    beforeEach(() => {
      performanceNowSpy
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(42) // task duration: 42 ms
        .mockReturnValueOnce(50); // group duration: 50 ms;
    });

    it('should render line spinner for async tasks within group', async () => {
      const logger = new Logger();

      const group = logger.group('Running plugin "ESLint"', async () => {
        await logger.command('npx eslint . --format=json', async () => {});
        logger.warn('Skipping unknown rule "deprecation/deprecation"');
        return 'ESLint reported 4 errors and 11 warnings';
      });

      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('-')} ${ansis.blue('$')} npx eslint . --format=json`,
      );

      vi.advanceTimersByTime(cliSpinners.line.interval);
      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('\\')} ${ansis.blue('$')} npx eslint . --format=json`,
      );

      vi.advanceTimersByTime(cliSpinners.line.interval);
      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('|')} ${ansis.blue('$')} npx eslint . --format=json`,
      );

      vi.advanceTimersByTime(cliSpinners.line.interval);
      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('/')} ${ansis.blue('$')} npx eslint . --format=json`,
      );

      await expect(group).resolves.toBeUndefined();

      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('│')} ${ansis.green('$')} npx eslint . --format=json ${ansis.gray('(42 ms)')}
${ansis.cyan('│')} ${ansis.yellow('Skipping unknown rule "deprecation/deprecation"')}
${ansis.cyan('└')} ${ansis.green('ESLint reported 4 errors and 11 warnings')} ${ansis.gray('(50 ms)')}

`,
      );
    });

    it('should colorize line spinner with same color as group', async () => {
      const logger = new Logger();

      const group1 = logger.group('Running plugin "ESLint"', async () => {
        await logger.command('npx eslint . --format=json', async () => {});
        return 'ESLint reported 4 errors and 11 warnings';
      });

      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('-')} ${ansis.blue('$')} npx eslint . --format=json`,
      );

      await group1;

      performanceNowSpy
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(cliSpinners.line.interval) // task duration
        .mockReturnValueOnce(cliSpinners.line.interval); // group duration

      const group2 = logger.group('Running plugin "Lighthouse"', async () => {
        await logger.task(
          `Executing ${ansis.bold('runLighthouse')} function`,
          async () => {
            await new Promise(resolve => {
              setTimeout(resolve, cliSpinners.line.interval);
            });
            return `Executed ${ansis.bold('runLighthouse')} function`;
          },
        );
        return 'Calculated Lighthouse scores for 4 categories';
      });

      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('│')} ${ansis.green('$')} npx eslint . --format=json ${ansis.gray('(42 ms)')}
${ansis.cyan('└')} ${ansis.green('ESLint reported 4 errors and 11 warnings')} ${ansis.gray('(50 ms)')}

${ansis.bold.magenta('❯ Running plugin "Lighthouse"')}
${ansis.magenta('-')} Executing ${ansis.bold('runLighthouse')} function`,
      );

      vi.advanceTimersByTime(cliSpinners.line.interval);
      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('│')} ${ansis.green('$')} npx eslint . --format=json ${ansis.gray('(42 ms)')}
${ansis.cyan('└')} ${ansis.green('ESLint reported 4 errors and 11 warnings')} ${ansis.gray('(50 ms)')}

${ansis.bold.magenta('❯ Running plugin "Lighthouse"')}
${ansis.magenta('\\')} Executing ${ansis.bold('runLighthouse')} function`,
      );

      await group2;
      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('│')} ${ansis.green('$')} npx eslint . --format=json ${ansis.gray('(42 ms)')}
${ansis.cyan('└')} ${ansis.green('ESLint reported 4 errors and 11 warnings')} ${ansis.gray('(50 ms)')}

${ansis.bold.magenta('❯ Running plugin "Lighthouse"')}
${ansis.magenta('│')} Executed ${ansis.bold('runLighthouse')} function ${ansis.gray('(130 ms)')}
${ansis.magenta('└')} ${ansis.green('Calculated Lighthouse scores for 4 categories')} ${ansis.gray('(130 ms)')}

`,
      );
    });

    it('should skip interactive group spinner in CI', async () => {
      vi.stubEnv('CI', 'true');
      const logger = new Logger();

      const group = logger.group('Running plugin "ESLint"', async () => {
        await logger.command('npx eslint . --format=json', async () => {});
        return 'ESLint reported 4 errors and 11 warnings';
      });

      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('│')} ${ansis.blue('$')} npx eslint . --format=json
`,
      );

      await group;

      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('│')} ${ansis.blue('$')} npx eslint . --format=json
${ansis.cyan('│')} ${ansis.green('$')} npx eslint . --format=json ${ansis.gray('(42 ms)')}
${ansis.cyan('└')} ${ansis.green('ESLint reported 4 errors and 11 warnings')} ${ansis.gray('(50 ms)')}

`,
      );
    });

    it('should fail group if spinner task rejects', async () => {
      const logger = new Logger();

      const group = logger.group('Running plugin "ESLint"', async () => {
        await logger.command('npx eslint . --format=json', async () => {
          await new Promise(resolve => {
            setTimeout(resolve, 0);
          });
          throw new Error('Process failed with exit code 1');
        });
        return 'ESLint reported 4 errors and 11 warnings';
      });

      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('-')} ${ansis.blue('$')} npx eslint . --format=json`,
      );

      vi.advanceTimersToNextTimer();
      await expect(group).rejects.toThrow('Process failed with exit code 1');

      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('│')} ${ansis.red('$')} npx eslint . --format=json
${ansis.cyan('└')} ${ansis.red('Process failed with exit code 1')}

`,
      );
    });

    it('should fail spinner, complete group and exit if SIGINT received', async () => {
      vi.spyOn(process, 'exit').mockReturnValue(undefined as never);
      vi.spyOn(os, 'platform').mockReturnValue('win32');
      const logger = new Logger();

      logger.group('Running plugin "ESLint"', async () => {
        await logger.command('npx eslint . --format=json', async () => {});
        return 'ESLint reported 4 errors and 11 warnings';
      });

      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('-')} ${ansis.blue('$')} npx eslint . --format=json`,
      );

      process.emit('SIGINT');

      expect(output).toBe(
        `
${ansis.bold.cyan('❯ Running plugin "ESLint"')}
${ansis.cyan('└')} ${ansis.blue('$')} npx eslint . --format=json ${ansis.red.bold('[SIGINT]')}

${ansis.red.bold('Cancelled by SIGINT')}
`,
      );

      expect(process.exit).toHaveBeenCalledWith(2);
    });

    it('should indent other logs within group if they were logged while spinner was active', async () => {
      vi.stubEnv('CP_VERBOSE', 'true');
      const logger = new Logger();

      const group = logger.group('Running plugin "ESLint"', async () => {
        await logger.command('npx eslint . --format=json', async () => {
          logger.debug('ESLint v9.0.0\n\nAll files pass linting.\n');
        });
        return 'ESLint reported 0 problems';
      });

      expect(ansis.strip(output)).toBe(
        `
❯ Running plugin "ESLint"
- $ npx eslint . --format=json`,
      );

      await expect(group).resolves.toBeUndefined();

      expect(ansis.strip(output)).toBe(
        `
❯ Running plugin "ESLint"
│ $ npx eslint . --format=json (42 ms)
│   ESLint v9.0.0
│   
│   All files pass linting.
│   
└ ESLint reported 0 problems (50 ms)

`,
      );
    });

    it('should indent other logs from spinner in group when it fails in CI', async () => {
      vi.stubEnv('CI', 'true');
      const logger = new Logger();

      const group = logger.group('Running plugin "ESLint"', async () => {
        await logger.command('npx eslint . --format=json', async () => {
          logger.error(
            "\nOops! Something went wrong! :(\n\nESLint: 8.26.0\n\nESLint couldn't find a configuration file.\n",
          );
          throw new Error('Process failed with exit code 2');
        });
        return 'ESLint reported 0 problems';
      });

      await expect(group).rejects.toThrow('Process failed with exit code 2');

      expect(ansis.strip(output)).toBe(
        `
❯ Running plugin "ESLint"
│ $ npx eslint . --format=json
│   
│   Oops! Something went wrong! :(
│   
│   ESLint: 8.26.0
│   
│   ESLint couldn't find a configuration file.
│   
│ $ npx eslint . --format=json
└ Process failed with exit code 2

`,
      );
    });
  });

  describe('invalid usage', () => {
    it('should throw if nesting group in another group', async () => {
      const logger = new Logger();

      await expect(
        logger.group('Outer group', async () => {
          await logger.group('Inner group', async () => 'Inner group complete');
          return 'Outer group complete';
        }),
      ).rejects.toThrow(
        'Internal Logger error - nested groups are not supported',
      );
    });

    it('should throw if nesting groups across logger instances', async () => {
      await expect(
        new Logger().group('Outer group', async () => {
          await new Logger().group(
            'Inner group',
            async () => 'Inner group complete',
          );
          return 'Outer group complete';
        }),
      ).rejects.toThrow(
        'Internal Logger error - nested groups are not supported',
      );
    });

    it('should throw if creating group while spinner is running', async () => {
      const logger = new Logger();

      await expect(
        logger.task('Some async process', async () => {
          await logger.group('Some group', async () => 'Group completed');
          return 'Async process completed';
        }),
      ).rejects.toThrow(
        'Internal Logger error - creating group in active spinner is not supported',
      );
    });

    it('should throw if starting new spinner while another is still active', async () => {
      const logger = new Logger();

      await expect(
        Promise.all([
          logger.task('Task 1', async () => 'DONE'),
          logger.task('Task 2', async () => 'DONE'),
        ]),
      ).rejects.toThrow(
        'Internal Logger error - concurrent spinners are not supported',
      );
    });
  });

  it('should throw if spinners are nested', async () => {
    const logger = new Logger();

    await expect(
      logger.task('Task 1', async () => {
        await logger.task('Task 2', async () => 'DONE');
        return 'DONE';
      }),
    ).rejects.toThrow(
      'Internal Logger error - concurrent spinners are not supported',
    );
  });
});
