import { readFileSync, unlinkSync } from 'fs';
import { vol } from 'memfs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Report } from '@code-pushup/models';
import {
  MEMFS_VOLUME,
  config,
  mockPersistConfig,
  report,
} from '@code-pushup/models/testing';
import { mockConsole, unmockConsole } from '../../../test/console.mock';
import { logPersistedResults, persistReport } from './persist';

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});

vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

const outputDir = MEMFS_VOLUME;
const reportPath = (format: 'json' | 'md') =>
  join(outputDir, 'report.' + format);
const readReport = (format: 'json' | 'md') => {
  const reportContent = readFileSync(reportPath(format)).toString();
  if (format === 'json') {
    return JSON.parse(reportContent);
  } else {
    return reportContent;
  }
};

const dummyReport = report();
const dummyConfig = config(MEMFS_VOLUME);
let logs: string[] = [];

const resetFiles = async () => {
  vol.reset();
  vol.fromJSON(
    {
      [reportPath('json')]: '',
      [reportPath('md')]: '',
    },
    MEMFS_VOLUME,
  );
  unlinkSync(reportPath('json'));
  unlinkSync(reportPath('md'));
};
const setupConsole = async () => {
  logs = [];
  mockConsole(msg => logs.push(msg));
};
const teardownConsole = async () => {
  logs = [];
  unmockConsole();
};

describe('persistReport', () => {
  beforeEach(async () => {
    resetFiles();
    setupConsole();
  });

  afterEach(() => {
    teardownConsole();
  });

  it('should stdout as format by default`', async () => {
    await persistReport(dummyReport, dummyConfig);
    const logReport = logs.join('\n');
    expect(logReport).toMatchSnapshot();

    expect(() => readReport('json')).not.toThrow();
    expect(() => readReport('md')).toThrow('no such file or directory');
  });

  it('should log to console when format is stdout`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({ outputDir, format: ['stdout'] }),
    });
    const logReport = logs.join('\n');
    expect(logReport).toMatchSnapshot();

    expect(() => readReport('json')).not.toThrow('no such file or directory');
    expect(() => readReport('md')).toThrow('no such file or directory');
  });

  it('should persist json format`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({ outputDir, format: ['json'] }),
    });
    const jsonReport: Report = readReport('json');
    expect(jsonReport).toMatchSnapshot();

    expect(console.log).toHaveBeenCalledTimes(0);
    expect(() => readReport('md')).toThrow('no such file or directory');
  });

  it('should persist md format`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({ outputDir, format: ['md'] }),
    });
    const mdReport = readFileSync(reportPath('md')).toString();
    expect(mdReport).toMatchSnapshot();

    expect(console.log).toHaveBeenCalledTimes(0);
    expect(() => readFileSync(reportPath('json'))).not.toThrow(
      'no such file or directory',
    );
  });

  it('should persist all formats`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({
        outputDir,
        format: ['json', 'md', 'stdout'],
      }),
    });

    const jsonReport: Report = readReport('json');
    expect(jsonReport).toMatchSnapshot();

    const mdReport = readFileSync(reportPath('md')).toString();
    expect(mdReport).toMatchSnapshot();

    const logReport = logs.join('\n');
    expect(logReport).toMatchSnapshot();
  });

  it('should persist some formats`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({ outputDir, format: ['md', 'stdout'] }),
    });

    expect(() => readFileSync(reportPath('json'))).not.toThrow(
      'no such file or directory',
    );

    const mdReport = readFileSync(reportPath('md')).toString();
    expect(mdReport).toMatchSnapshot();

    const logReport = logs.join('\n');
    expect(logReport).toMatchSnapshot();
  });

  // TODO: should throw PersistDirError
  // TODO: should throw PersistError
});

describe('logPersistedResults', () => {
  beforeEach(async () => {
    resetFiles();
    setupConsole();
  });

  afterEach(() => {
    teardownConsole();
  });

  it('should log report sizes correctly`', async () => {
    logPersistedResults([{ status: 'fulfilled', value: ['out.json', 10000] }]);
    expect(logs.length).toBe(2);
    expect(logs).toContain('Generated reports successfully: ');
    expect(logs).toContain('- [1mout.json[22m ([90m9.77 kB[39m)');
  });

  it('should log fails correctly`', async () => {
    logPersistedResults([{ status: 'rejected', reason: 'fail' }]);
    expect(logs.length).toBe(2);

    expect(logs).toContain('Generated reports failed: ');
    expect(logs).toContain('- [1mfail[22m');
  });

  it('should log report sizes and fails correctly`', async () => {
    logPersistedResults([
      { status: 'fulfilled', value: ['out.json', 10000] },
      { status: 'rejected', reason: 'fail' },
    ]);
    expect(logs.length).toBe(4);
    expect(logs).toContain('Generated reports successfully: ');
    expect(logs).toContain('- [1mout.json[22m ([90m9.77 kB[39m)');

    expect(logs).toContain('Generated reports failed: ');
    expect(logs).toContain('- [1mfail[22m');
  });
});
