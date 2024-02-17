import { describe } from 'vitest';
import {
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import {
  ISO_STRING_REGEXP,
  MINIMAL_CONFIG_MOCK,
  MINIMAL_REPORT_MOCK,
} from '@code-pushup/test-utils';
import {
  CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from './collect-and-persist';
import { collect } from './implementation/collect';
import { logPersistedResults, persistReport } from './implementation/persist';
import { normalizePersistConfig } from './normalize';

vi.mock('./implementation/collect', () => ({
  collect: vi.fn().mockResolvedValue(MINIMAL_REPORT_MOCK),
}));

vi.mock('./implementation/persist', () => ({
  persistReport: vi.fn(),
  logPersistedResults: vi.fn(),
}));

describe('collectAndPersistReports', () => {
  it('should normalize options internally (default values)', async () => {
    const partialConfig: CollectAndPersistReportsOptions = {
      plugins: MINIMAL_CONFIG_MOCK.plugins,
      categories: MINIMAL_CONFIG_MOCK.categories,
      verbose: false,
      progress: false,
    };
    await collectAndPersistReports(partialConfig);

    expect(collect).toHaveBeenCalledWith(partialConfig);

    expect(persistReport).toHaveBeenCalledWith(expect.any(Object), {
      filename: PERSIST_FILENAME,
      format: PERSIST_FORMAT,
      outputDir: PERSIST_OUTPUT_DIR,
    });

    expect(logPersistedResults).not.toHaveBeenCalled();
  });

  it('should call collect and persistReport with correct parameters in non-verbose mode', async () => {
    const nonVerboseConfig = {
      ...MINIMAL_CONFIG_MOCK,
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
      normalizePersistConfig(nonVerboseConfig.persist),
    );

    expect(logPersistedResults).not.toHaveBeenCalled();
  });

  it('should call collect and persistReport with correct parameters in verbose mode', async () => {
    const verboseConfig = {
      ...MINIMAL_CONFIG_MOCK,
      verbose: true,
      progress: false,
    };
    await collectAndPersistReports(verboseConfig);

    expect(collect).toHaveBeenCalledWith(verboseConfig);

    expect(persistReport).toHaveBeenCalledWith(
      MINIMAL_REPORT_MOCK,
      normalizePersistConfig(verboseConfig.persist),
    );

    expect(logPersistedResults).toHaveBeenCalled();
  });
});
