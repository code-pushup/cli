import { describe } from 'vitest';
import { Report } from '@code-pushup/models';
import { MINIMAL_CONFIG_MOCK } from '@code-pushup/testing-utils';
import { collectAndPersistReports } from './collect-and-persist';
import { collect } from './implementation/collect';
import { logPersistedResults, persistReport } from './implementation/persist';

vi.mock('./implementation/collect', async () => {
  return {
    collect: vi.fn().mockImplementation(
      async () =>
        ({
          packageName: 'code-pushup',
          version: '0.0.1',
          date: new Date().toString(),
          duration: 0,
          categories: [],
          plugins: [],
        } as Report),
    ),
  };
});

vi.mock('./implementation/persist', async () => {
  return {
    persistReport: vi.fn().mockImplementation(async () => ({})),
    logPersistedResults: vi.fn().mockReturnValue(undefined),
  };
});

describe('collectAndPersistReports', () => {
  it('should call collect and persistReport with correct parameters in non-verbose mode', async () => {
    await collectAndPersistReports({
      ...MINIMAL_CONFIG_MOCK,
      verbose: false,
      progress: false,
    });

    expect(collect).toHaveBeenCalledWith({
      ...MINIMAL_CONFIG_MOCK,
      verbose: false,
      progress: false,
    });

    expect(persistReport).toHaveBeenCalledWith(
      {
        packageName: 'code-pushup',
        version: '0.0.1',
        date: expect.any(String),
        duration: 0,
        categories: [],
        plugins: [],
      },
      {
        ...MINIMAL_CONFIG_MOCK,
        verbose: false,
        progress: false,
      },
    );

    expect(logPersistedResults).not.toHaveBeenCalled();
  });

  it('should call collect and persistReport with correct parameters in verbose mode', async () => {
    await collectAndPersistReports({
      ...MINIMAL_CONFIG_MOCK,
      verbose: true,
      progress: false,
    });

    expect(collect).toHaveBeenCalledWith({
      ...MINIMAL_CONFIG_MOCK,
      verbose: true,
      progress: false,
    });

    expect(persistReport).toHaveBeenCalledWith(
      {
        packageName: 'code-pushup',
        version: '0.0.1',
        date: expect.any(String),
        duration: 0,
        categories: [],
        plugins: [],
      } as Report,
      {
        ...MINIMAL_CONFIG_MOCK,
        verbose: true,
        progress: false,
      },
    );

    expect(logPersistedResults).toHaveBeenCalled();
  });
});
