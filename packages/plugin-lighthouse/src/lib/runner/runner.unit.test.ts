import type { Config } from 'lighthouse';
import { runLighthouse } from 'lighthouse/cli/run.js';
import type { Result } from 'lighthouse/types/lhr/audit-result';
import { expect, vi } from 'vitest';
import { DEFAULT_CLI_FLAGS } from './constants.js';
import { createRunnerFunction } from './runner.js';
import type { LighthouseCliFlags } from './types.js';
import { determineAndSetLogLevel, getConfig } from './utils.js';

// used for createRunnerMocking
vi.mock('./utils', async () => {
  // Import the actual 'lighthouse' module
  const actual = await vi.importActual('./utils');

  const actualDetermineAndSetLogLevel = actual['determineAndSetLogLevel'] as (
    s: string,
  ) => string;
  // Return the mocked module, merging the actual module with overridden parts
  return {
    ...actual,
    determineAndSetLogLevel: vi
      .fn()
      .mockImplementation(actualDetermineAndSetLogLevel),
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
  it('should call runLighthouse with defaults when executed with only url given', async () => {
    const runner = createRunnerFunction('https://localhost:8080');
    await expect(runner(undefined)).resolves.toEqual(
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

  it('should call determineAndSetLogLevel with given verbose and quiet flags', async () => {
    await createRunnerFunction('https://localhost:8080', {
      verbose: true,
      quiet: true,
    } as LighthouseCliFlags)(undefined);
    expect(determineAndSetLogLevel).toHaveBeenCalledWith(
      expect.objectContaining({ verbose: true, quiet: true }),
    );
  });

  it('should call getConfig with given configPath', async () => {
    await createRunnerFunction('https://localhost:8080', {
      configPath: 'lh-config.js',
    } as LighthouseCliFlags)(undefined);
    expect(getConfig).toHaveBeenCalledWith(
      expect.objectContaining({ configPath: 'lh-config.js' }),
    );
  });

  it('should throw if lighthouse returns an empty result', async () => {
    const runner = createRunnerFunction('fail');
    await expect(runner(undefined)).rejects.toThrow(
      'Lighthouse did not produce a result.',
    );
  });
});
