import ansis from 'ansis';
import type { Config } from 'lighthouse';
import { runLighthouse } from 'lighthouse/cli/run.js';
import type { Result } from 'lighthouse/types/lhr/audit-result';
import { expect, vi } from 'vitest';
import { DEFAULT_PERSIST_CONFIG } from '@code-pushup/models';
import { logger } from '@code-pushup/utils';
import { DEFAULT_CLI_FLAGS } from './constants.js';
import { createRunnerFunction } from './runner.js';
import type { LighthouseCliFlags } from './types.js';
import { enrichFlags, getConfig } from './utils.js';

// used for createRunnerMocking
vi.mock('./utils', async () => {
  // Import the actual 'lighthouse' module
  const actual = await vi.importActual('./utils');

  const actualEnrichFlags = actual['enrichFlags'] as (
    f: LighthouseCliFlags,
    i?: number,
  ) => string;
  // Return the mocked module, merging the actual module with overridden parts
  return {
    ...actual,
    enrichFlags: vi.fn().mockImplementation(actualEnrichFlags),
    getBudgets: vi.fn().mockImplementation((path: string) => [{ path }]),
    getConfig: vi.fn(),
  };
});

vi.mock('lighthouse/cli/run.js', async () => {
  // Import the actual 'lighthouse' module
  const actual = await import('lighthouse/cli/run.js');
  // Define the mock implementation
  const mockRunLighthouse = vi.fn(
    (url: string, flags: LighthouseCliFlags, config: Config) =>
      url.includes('fail')
        ? undefined
        : {
            flags,
            config,
            lhr: {
              audits: {
                'cumulative-layout-shift': {
                  id: 'cumulative-layout-shift',
                  title: 'Cumulative Layout Shift',
                  description:
                    'Cumulative Layout Shift measures the movement of visible elements within the viewport.',
                  scoreDisplayMode: 'numeric',
                  numericValue: 1200,
                  displayValue: '1.2 s',
                  score: 0.9,
                } satisfies Result,
              },
            },
          },
  );

  // Return the mocked module, merging the actual module with overridden parts
  return {
    ...actual,
    runLighthouse: mockRunLighthouse, // Mock the default export if 'lighthouse' is imported as default
  };
});

describe('createRunnerFunction', () => {
  const args = { persist: DEFAULT_PERSIST_CONFIG };

  it('should call runLighthouse with defaults when executed with only url given', async () => {
    const runner = createRunnerFunction(['https://localhost:8080']);
    await expect(runner(args)).resolves.toEqual(
      expect.arrayContaining([
        {
          slug: 'cumulative-layout-shift',
          value: 1200,
          displayValue: '1.2 s',
          score: 0.9,
        },
      ]),
    );

    expect(runLighthouse).toHaveBeenCalledWith(
      'https://localhost:8080',
      { ...DEFAULT_CLI_FLAGS, logLevel: 'silent' },
      undefined,
    );
  });

  it('should call enrichFlags with correct parameters for single URL', async () => {
    await createRunnerFunction(['https://localhost:8080'])(args);

    expect(enrichFlags).toHaveBeenCalledWith(DEFAULT_CLI_FLAGS);
  });

  it('should call enrichFlags with URL index for multiple URLs', async () => {
    await createRunnerFunction([
      'https://localhost:8080',
      'https://localhost:8081',
    ])(args);

    expect(enrichFlags).toHaveBeenCalledWith(DEFAULT_CLI_FLAGS, 1);
    expect(enrichFlags).toHaveBeenCalledWith(DEFAULT_CLI_FLAGS, 2);
  });

  it('should call getConfig with given configPath', async () => {
    await createRunnerFunction(['https://localhost:8080'], {
      configPath: 'lh-config.js',
    } as LighthouseCliFlags)(args);
    expect(getConfig).toHaveBeenCalledWith(
      expect.objectContaining({ configPath: 'lh-config.js' }),
    );
  });

  it('should throw if lighthouse returns an empty result', async () => {
    const runner = createRunnerFunction(['fail']);
    await expect(runner(args)).rejects.toThrow(
      'Lighthouse did not produce a result.',
    );
  });

  it('should handle multiple URLs and add URL index to audit slugs', async () => {
    const runner = createRunnerFunction([
      'https://localhost:8080',
      'https://localhost:8081',
    ]);
    await expect(runner(args)).resolves.toEqual(
      expect.arrayContaining([
        {
          slug: 'cumulative-layout-shift-1',
          value: 1200,
          displayValue: '1.2 s',
          score: 0.9,
        },
        {
          slug: 'cumulative-layout-shift-2',
          value: 1200,
          displayValue: '1.2 s',
          score: 0.9,
        },
      ]),
    );
    expect(runLighthouse).toHaveBeenCalledWith(
      'https://localhost:8080',
      expect.objectContaining({
        outputPath: expect.pathToMatch(
          '.code-pushup/lighthouse/lighthouse-report-1.json',
        ),
      }),
      undefined,
    );
    expect(runLighthouse).toHaveBeenCalledWith(
      'https://localhost:8081',
      expect.objectContaining({
        outputPath: expect.pathToMatch(
          '.code-pushup/lighthouse/lighthouse-report-2.json',
        ),
      }),
      undefined,
    );
    expect(runLighthouse).toHaveBeenCalledTimes(2);
  });

  it('should handle single URL without adding index to audit slugs', async () => {
    const runner = createRunnerFunction(['https://localhost:8080']);
    await expect(runner(args)).resolves.toEqual(
      expect.arrayContaining([
        {
          slug: 'cumulative-layout-shift',
          value: 1200,
          displayValue: '1.2 s',
          score: 0.9,
        },
      ]),
    );
  });

  it('should continue with other URLs when one fails in multiple URL scenario', async () => {
    const runner = createRunnerFunction([
      'https://localhost:8080',
      'fail',
      'https://localhost:8082',
    ]);

    await expect(runner(args)).resolves.toEqual(
      expect.arrayContaining([
        {
          slug: 'cumulative-layout-shift-1',
          value: 1200,
          displayValue: '1.2 s',
          score: 0.9,
        },
        {
          slug: 'cumulative-layout-shift-3',
          value: 1200,
          displayValue: '1.2 s',
          score: 0.9,
        },
      ]),
    );

    expect(logger.warn).toHaveBeenCalledWith(
      `Lighthouse did not produce a result for URL: ${ansis.underline.blueBright('fail')}`,
    );
  });

  it('should throw error if all URLs fail in multiple URL scenario', async () => {
    const runner = createRunnerFunction(['fail1', 'fail2', 'fail3']);
    await expect(runner(args)).rejects.toThrow(
      'Lighthouse failed to produce results for all URLs.',
    );
  });

  it('should generate URL-specific output paths for multiple URLs', async () => {
    const runner = createRunnerFunction([
      'https://localhost:8080',
      'https://localhost:8081',
    ]);

    await runner(args);

    expect(runLighthouse).toHaveBeenCalledWith(
      'https://localhost:8080',
      expect.objectContaining({
        outputPath: expect.pathToMatch(
          '.code-pushup/lighthouse/lighthouse-report-1.json',
        ),
      }),
      undefined,
    );
    expect(runLighthouse).toHaveBeenCalledWith(
      'https://localhost:8081',
      expect.objectContaining({
        outputPath: expect.pathToMatch(
          '.code-pushup/lighthouse/lighthouse-report-2.json',
        ),
      }),
      undefined,
    );
  });
});
