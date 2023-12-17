import { describe } from 'vitest';
import { Report } from '@code-pushup/models';
import {
  ISO_STRING_REGEXP,
  MINIMAL_CONFIG_MOCK,
} from '@code-pushup/testing-utils';
import {
  CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from './collect-and-persist';
import { collect } from './implementation/collect';
import { logPersistedResults, persistReport } from './implementation/persist';
import { normalizePersistConfig } from './normalize';

vi.mock('./implementation/collect', () => ({
  collect: vi.fn().mockResolvedValue({
    packageName: 'code-pushup',
    version: '0.0.1',
    date: new Date().toISOString(),
    duration: 0,
    categories: [],
    plugins: [],
  } as Report),
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

    expect(persistReport).toHaveBeenCalledWith(
      {
        packageName: 'code-pushup',
        version: '0.0.1',
        date: expect.stringMatching(ISO_STRING_REGEXP),
        duration: 0,
        categories: [],
        plugins: [],
      },
      normalizePersistConfig(partialConfig?.persist),
    );

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
        packageName: 'code-pushup',
        version: '0.0.1',
        date: expect.stringMatching(ISO_STRING_REGEXP),
        duration: 0,
        categories: [],
        plugins: [],
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
      {
        packageName: 'code-pushup',
        version: '0.0.1',
        date: expect.stringMatching(ISO_STRING_REGEXP),
        duration: 0,
        categories: [],
        plugins: [],
      } as Report,
      normalizePersistConfig(verboseConfig.persist),
    );

    expect(logPersistedResults).toHaveBeenCalled();
  });
});
