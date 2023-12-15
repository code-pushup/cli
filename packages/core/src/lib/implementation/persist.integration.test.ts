import { readFileSync, unlinkSync } from 'fs';
import { vol } from 'memfs';
import { join } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Report } from '@code-pushup/models';
import {
  MEMFS_VOLUME,
  minimalReport,
  persistConfig,
} from '@code-pushup/models/testing';
import {
  CODE_PUSHUP_DOMAIN,
  FOOTER_PREFIX,
  README_LINK,
} from '@code-pushup/utils';
import { logPersistedResults, persistReport } from './persist';

// Mock file system API's
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

const dummyReport = minimalReport();

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

// @TODO refactor away from snapshots in favour of disc space and readability
describe('persistReport', () => {
  beforeEach(async () => {
    await resetFiles();
  });

  it('should stdout as format by default`', async () => {
    await persistReport(dummyReport, persistConfig({outputDir}));
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(`${FOOTER_PREFIX} ${CODE_PUSHUP_DOMAIN}`),
    );

    expect(() => readReport('json')).not.toThrow();
    expect(() => readReport('md')).toThrow('no such file or directory');
  });

  it('should log to console regardless of format`', async () => {
    const persist = persistConfig({ outputDir, format: [] });

    await persistReport(dummyReport, persist);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(`${FOOTER_PREFIX} ${CODE_PUSHUP_DOMAIN}`),
    );

    expect(() => readReport('json')).not.toThrow('no such file or directory');
    expect(() => readReport('md')).toThrow('no such file or directory');
  });

  it('should persist json format`', async () => {
    const persist = persistConfig({ outputDir, format: ['json'] });
    await persistReport(dummyReport, persist);
    const jsonReport: Report = readReport('json');
    expect(jsonReport.packageName).toBe('@code-pushup/core');

    expect(() => readReport('md')).toThrow('no such file or directory');
  });

  it('should persist md format`', async () => {
    const persist = persistConfig({ outputDir, format: ['md'] });
    await persistReport(dummyReport, persist);
    const mdReport = readFileSync(reportPath('md')).toString();
    expect(mdReport).toContain(
      `${FOOTER_PREFIX} [Code PushUp](${README_LINK})`,
    );

    expect(() => readFileSync(reportPath('json'))).not.toThrow(
      'no such file or directory',
    );
  });

  it('should persist all formats`', async () => {
    const persist = persistConfig({
      outputDir,
      format: ['json', 'md'],
    });
    await persistReport(dummyReport, persist);

    const jsonReport: Report = readReport('json');
    expect(jsonReport.packageName).toBe('@code-pushup/core');

    const mdReport = readFileSync(reportPath('md')).toString();
    expect(mdReport).toContain(
      `${FOOTER_PREFIX} [Code PushUp](${README_LINK})`,
    );

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(`${FOOTER_PREFIX} ${CODE_PUSHUP_DOMAIN}`),
    );
  });

  it('should persist some formats`', async () => {
    const persist = persistConfig({ outputDir, format: ['md'] });
    await persistReport(dummyReport, persist);

    expect(() => readFileSync(reportPath('json'))).not.toThrow(
      'no such file or directory',
    );

    const mdReport = readFileSync(reportPath('md')).toString();
    expect(mdReport).toContain(
      `${FOOTER_PREFIX} [Code PushUp](${README_LINK})`,
    );

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(`${FOOTER_PREFIX} ${CODE_PUSHUP_DOMAIN}`),
    );
  });

  // @TODO: should throw PersistDirError
  // @TODO: should throw PersistError
});

describe('logPersistedResults', () => {
  it('should log report sizes correctly`', async () => {
    logPersistedResults([{ status: 'fulfilled', value: ['out.json', 10000] }]);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Generated reports successfully: '),
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('- [1mout.json[22m ([90m9.77 kB[39m)'),
    );
  });

  it('should log fails correctly`', async () => {
    logPersistedResults([{ status: 'rejected', reason: 'fail' }]);

    expect(console.warn).toHaveBeenCalledWith('Generated reports failed: ');
    expect(console.warn).toHaveBeenCalledWith('- [1mfail[22m');
  });

  it('should log report sizes and fails correctly`', async () => {
    logPersistedResults([
      { status: 'fulfilled', value: ['out.json', 10000] },
      { status: 'rejected', reason: 'fail' },
    ]);

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Generated reports successfully: '),
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('- [1mout.json[22m ([90m9.77 kB[39m)'),
    );

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Generated reports failed: '),
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('- [1mfail[22m'),
    );
  });
});
