import { type MockInstance, describe } from 'vitest';
import {
  MINIMAL_CONFIG_MOCK,
  MINIMAL_REPORT_MOCK,
} from '@code-pushup/test-fixtures';
import * as utils from '@code-pushup/utils';
import {
  type ScoredReport,
  logStdoutSummary,
  scoreReport,
  sortReport,
} from '@code-pushup/utils';
import {
  type CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from './collect-and-persist.js';
import { collect } from './implementation/collect.js';
import { logPersistedReport, persistReport } from './implementation/persist.js';

vi.mock('./implementation/collect', () => ({
  collect: vi.fn().mockResolvedValue(MINIMAL_REPORT_MOCK),
}));

vi.mock('./implementation/persist', () => ({
  persistReport: vi.fn(),
  logPersistedReport: vi.fn(),
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

  it('should call collect and persistReport with correct parameters', async () => {
    const sortedScoredReport = sortReport(scoreReport(MINIMAL_REPORT_MOCK));

    const config: CollectAndPersistReportsOptions = {
      ...MINIMAL_CONFIG_MOCK,
      persist: { outputDir: 'output', filename: 'report', format: ['md'] },
      cache: { read: false, write: false },
    };
    await collectAndPersistReports(config);

    expect(collect).toHaveBeenCalledWith(config);

    expect(persistReport).toHaveBeenCalledWith<
      Parameters<typeof persistReport>
    >(MINIMAL_REPORT_MOCK, sortedScoredReport, config.persist);

    expect(logStdoutSummary).toHaveBeenCalledWith(sortedScoredReport);
    expect(logPersistedReport).toHaveBeenCalled();
  });

  it('should call collect and not persistReport if skipReports options is true', async () => {
    const sortedScoredReport = sortReport(scoreReport(MINIMAL_REPORT_MOCK));

    const verboseConfig: CollectAndPersistReportsOptions = {
      ...MINIMAL_CONFIG_MOCK,
      persist: {
        outputDir: 'output',
        filename: 'report',
        format: ['md'],
        skipReports: true,
      },
      cache: { read: false, write: false },
    };
    await collectAndPersistReports(verboseConfig);

    expect(collect).toHaveBeenCalledWith(verboseConfig);

    expect(persistReport).not.toHaveBeenCalled();
    expect(logPersistedReport).not.toHaveBeenCalled();

    expect(logStdoutSummary).toHaveBeenCalledWith(sortedScoredReport);
  });

  it('should print a summary to stdout', async () => {
    await collectAndPersistReports(
      MINIMAL_CONFIG_MOCK as CollectAndPersistReportsOptions,
    );
    expect(utils.logger.info).toHaveBeenCalledWith(
      'Made with ❤ by code-pushup.dev',
    );
  });
});
