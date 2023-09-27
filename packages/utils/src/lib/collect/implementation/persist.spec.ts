import { Report } from '@quality-metrics/models';
import {
  MEMFS_VOLUME,
  dummyConfig,
  dummyReport,
  mockPersistConfig,
} from '@quality-metrics/models/testing';
import { readFileSync, unlinkSync } from 'fs';
import { vol } from 'memfs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockConsole, unmockConsole } from './mock/helper.mock';
import { persistReport } from './persist';

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});

vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

const outputPath = MEMFS_VOLUME;
const reportPath = (format: 'json' | 'md') =>
  join(outputPath, 'report.' + format);
const readReport = (format: 'json' | 'md') => {
  const reportContent = readFileSync(reportPath(format)).toString();
  if (format === 'json') {
    return JSON.parse(reportContent);
  } else {
    return reportContent;
  }
};

const config = dummyConfig(MEMFS_VOLUME);

describe('persistReport', () => {
  let logs: string[] = [];

  beforeEach(async () => {
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

    logs = [];
    mockConsole(msg => logs.push(msg));
  });

  afterEach(() => {
    logs = [];
    unmockConsole();
  });

  it('should stdout as format by default`', async () => {
    await persistReport(dummyReport, config);
    expect(logs.find(log => log.match(/Code Pushup Report/))).toBeTruthy();

    expect(() => readReport('json')).not.toThrow();
    expect(() => readReport('md')).toThrow('no such file or directory');
  });

  it('should log to console when format is stdout`', async () => {
    await persistReport(dummyReport, {
      ...config,
      persist: mockPersistConfig({ outputPath, format: ['stdout'] }),
    });
    expect(logs.find(log => log.match(/Code Pushup Report/))).toBeTruthy();

    expect(() => readReport('json')).not.toThrow('no such file or directory');
    expect(() => readReport('md')).toThrow('no such file or directory');
  });

  it('should persist json format`', async () => {
    await persistReport(dummyReport, {
      ...config,
      persist: mockPersistConfig({ outputPath, format: ['json'] }),
    });
    const jsonReport: Report = readReport('json');
    expect(jsonReport.plugins?.[0]?.slug).toBe('plg-0');
    expect(jsonReport.plugins?.[0]?.audits[0]?.slug).toBe('0a');

    expect(console.log).toHaveBeenCalledTimes(0);
    expect(() => readReport('md')).toThrow('no such file or directory');
  });

  it('should persist md format`', async () => {
    await persistReport(dummyReport, {
      ...config,
      persist: mockPersistConfig({ outputPath, format: ['md'] }),
    });
    const mdReport = readFileSync(reportPath('md')).toString();
    expect(mdReport).toContain('# Code Pushup Report');

    expect(console.log).toHaveBeenCalledTimes(0);
    expect(() => readFileSync(reportPath('json'))).not.toThrow(
      'no such file or directory',
    );
  });

  it('should persist all formats`', async () => {
    await persistReport(dummyReport, {
      ...config,
      persist: mockPersistConfig({
        outputPath,
        format: ['json', 'md', 'stdout'],
      }),
    });

    const jsonReport: Report = readReport('json');
    expect(jsonReport.plugins?.[0]?.slug).toBe('plg-0');
    expect(jsonReport.plugins?.[0]?.audits[0]?.slug).toBe('0a');

    const mdReport = readFileSync(reportPath('md')).toString();
    expect(mdReport).toContain('# Code Pushup Report');

    expect(logs.find(log => log.match(/Code Pushup Report/))).toBeTruthy();
  });

  it('should persist some formats`', async () => {
    await persistReport(dummyReport, {
      ...config,
      persist: mockPersistConfig({ outputPath, format: ['md', 'stdout'] }),
    });

    expect(() => readFileSync(reportPath('json'))).not.toThrow(
      'no such file or directory',
    );

    const mdReport = readFileSync(reportPath('md')).toString();
    expect(mdReport).toContain('# Code Pushup Report');
    expect(logs.find(log => log.match(/Code Pushup Report/))).toBeTruthy();
  });

  // TODO: should throw PersistDirError
  // TODO: should throw PersistError
});
