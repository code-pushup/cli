import { describe } from 'vitest';
import {
  ISO_STRING_REGEXP,
  MINIMAL_CONFIG_MOCK,
  MINIMAL_REPORT_MOCK,
} from '@code-pushup/test-utils';
import { collectAndPersistReports } from './collect-and-persist';
import { collect } from './implementation/collect';
import { logPersistedResults, persistReport } from './implementation/persist';

vi.mock('./implementation/collect', () => ({
  collect: vi.fn().mockResolvedValue(MINIMAL_REPORT_MOCK),
}));

vi.mock('./implementation/persist', () => ({
  persistReport: vi.fn(),
  logPersistedResults: vi.fn(),
}));

describe('collectAndPersistReports', () => {
  it('should call collect and persistReport with correct parameters in non-verbose mode', async () => {
    const nonVerboseConfig = {
      ...MINIMAL_CONFIG_MOCK,
      persist: {
        outputDir: 'output',
        filename: 'report',
        format: ['md'],
      },
      verbose: false,
      progress: false,
    };
    await collectAndPersistReports(nonVerboseConfig);

    expect(collect).toHaveBeenCalledWith(nonVerboseConfig);

    expect(persistReport).toHaveBeenCalledWith(
      {
        packageName: '@code-pushup/core',
        version: '0.0.1',
        date: expect.stringMatching(ISO_STRING_REGEXP),
        duration: 666,
        categories: expect.any(Array),
        plugins: expect.any(Array),
      },
      {
        outputDir: 'output',
        filename: 'report',
        format: ['md'],
      },
    );

    expect(logPersistedResults).not.toHaveBeenCalled();
  });

  it('should call collect and persistReport with correct parameters in verbose mode', async () => {
    const verboseConfig = {
      ...MINIMAL_CONFIG_MOCK,
      persist: {
        outputDir: 'output',
        filename: 'report',
        format: ['md'],
      },
      verbose: true,
      progress: false,
    };
    await collectAndPersistReports(verboseConfig);

    expect(collect).toHaveBeenCalledWith(verboseConfig);

    expect(persistReport).toHaveBeenCalledWith(
      MINIMAL_REPORT_MOCK,
      verboseConfig.persist,
    );

    expect(logPersistedResults).toHaveBeenCalled();
  });
});
