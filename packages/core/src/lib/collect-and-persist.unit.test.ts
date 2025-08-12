import { type MockInstance, describe } from 'vitest';
import {
  ISO_STRING_REGEXP,
  MINIMAL_CONFIG_MOCK,
  MINIMAL_REPORT_MOCK,
} from '@code-pushup/test-utils';
import {
  type ScoredReport,
  isVerbose,
  logStdoutSummary,
  scoreReport,
  sortReport,
  ui,
} from '@code-pushup/utils';
import * as utils from '@code-pushup/utils';
import {
  type CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from './collect-and-persist.js';
import { collect } from './implementation/collect.js';
import {
  logPersistedResults,
  persistReport,
} from './implementation/persist.js';

vi.mock('./implementation/collect', () => ({
  collect: vi.fn().mockResolvedValue(MINIMAL_REPORT_MOCK),
}));

vi.mock('./implementation/persist', () => ({
  persistReport: vi.fn(),
  logPersistedResults: vi.fn(),
}));

describe('collectAndPersistReports', () => {
  let logStdoutSpy: MockInstance<
    [report: ScoredReport, verbose?: boolean],
    void
  >;

  beforeEach(() => {
    logStdoutSpy = vi.spyOn(utils, 'logStdoutSummary');
  });

  afterAll(() => {
    logStdoutSpy.mockRestore();
  });

  it('should call collect and persistReport with correct parameters in non-verbose mode', async () => {
    const sortedScoredReport = sortReport(scoreReport(MINIMAL_REPORT_MOCK));

    expect(isVerbose()).toBeFalse();

    const nonVerboseConfig: CollectAndPersistReportsOptions = {
      ...MINIMAL_CONFIG_MOCK,
      persist: {
        outputDir: 'output',
        filename: 'report',
        format: ['md'],
      },
      progress: false,
    };
    await collectAndPersistReports(nonVerboseConfig);

    expect(collect).toHaveBeenCalledWith(nonVerboseConfig);

    expect(persistReport).toHaveBeenCalledWith<
      Parameters<typeof persistReport>
    >(
      {
        packageName: '@code-pushup/core',
        version: '0.0.1',
        date: expect.stringMatching(ISO_STRING_REGEXP),
        duration: 666,
        commit: expect.any(Object),
        plugins: expect.any(Array),
      },
      sortedScoredReport,
      {
        outputDir: 'output',
        filename: 'report',
        format: ['md'],
      },
    );

    expect(logStdoutSummary).toHaveBeenCalledWith(sortedScoredReport);
    expect(logPersistedResults).not.toHaveBeenCalled();
  });

  it('should call collect and persistReport with correct parameters in verbose mode', async () => {
    const sortedScoredReport = sortReport(scoreReport(MINIMAL_REPORT_MOCK));

    vi.stubEnv('CP_VERBOSE', 'true');

    const verboseConfig: CollectAndPersistReportsOptions = {
      ...MINIMAL_CONFIG_MOCK,
      persist: {
        outputDir: 'output',
        filename: 'report',
        format: ['md'],
      },
      progress: false,
    };
    await collectAndPersistReports(verboseConfig);

    expect(collect).toHaveBeenCalledWith(verboseConfig);

    expect(persistReport).toHaveBeenCalledWith(
      MINIMAL_REPORT_MOCK,
      sortedScoredReport,
      verboseConfig.persist,
    );

    expect(logStdoutSummary).toHaveBeenCalledWith(sortedScoredReport);
    expect(logPersistedResults).toHaveBeenCalled();
  });

  it('should print a summary to stdout', async () => {
    await collectAndPersistReports(
      MINIMAL_CONFIG_MOCK as CollectAndPersistReportsOptions,
    );
    expect(ui()).toHaveLogged('log', 'Made with ❤ by code-pushup.dev');
  });
});
