import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { logPersistedResults, persistReport } from './persist';
import { readFileSync, unlinkSync } from 'fs';
import { Report } from '@quality-metrics/models';
import {
  dummyConfig,
  dummyReport,
  mockPersistConfig,
} from '@quality-metrics/models/testing';
import { join } from 'path';
import { mockConsole, unmockConsole } from './mock/helper.mock';

const outputPath = 'tmp';
const reportPath = (format = 'json') => join(outputPath, 'report.' + format);
const readReport = (format = 'json') => {
  const reportContent = readFileSync(reportPath(format)).toString();
  if (format === 'json') {
    return JSON.parse(reportContent);
  } else {
    return reportContent;
  }
};

let logs: string[] = [];

describe('persistReport', () => {
  beforeEach(async () => {
    try {
      unlinkSync(reportPath());
    } catch (_) {
      void 0;
    }

    try {
      unlinkSync(reportPath('md'));
    } catch (_) {
      void 0;
    }
    logs = [];
    mockConsole(msg => logs.push(msg));
  });
  afterEach(() => {
    logs = [];
    unmockConsole();
  });

  it('should stdout as format by default`', async () => {
    await persistReport(dummyReport, dummyConfig);
    expect(logs.find(log => log.match(/Code Pushup Report/))).toBeTruthy();

    expect(() => readReport()).not.toThrow();
    expect(() => readReport('md')).toThrow('no such file or directory');
  });

  it('should log to console when format is stdout`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({ outputPath, format: ['stdout'] }),
    });
    expect(logs.find(log => log.match(/Code Pushup Report/))).toBeTruthy();

    //
    expect(() => readReport()).not.toThrow('no such file or directory');
    expect(() => readReport('md')).toThrow('no such file or directory');
  });

  it('should persist json format`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({ outputPath, format: ['json'] }),
    });
    const jsonReport: Report = readReport();
    expect(jsonReport.plugins?.[0]?.slug).toBe('plg-0');
    expect(jsonReport.plugins?.[0]?.audits[0]?.slug).toBe('0a');
    //
    expect(console.log).toHaveBeenCalledTimes(0);
    expect(() => readReport('md')).toThrow('no such file or directory');
  });

  it('should persist md format`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({ outputPath, format: ['md'] }),
    });
    const mdReport = readFileSync(reportPath('md')).toString();
    expect(mdReport).toContain('# Code Pushup Report');
    //
    expect(console.log).toHaveBeenCalledTimes(0);
    expect(() => readFileSync(reportPath())).not.toThrow(
      'no such file or directory',
    );
  });

  it('should persist all formats`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({
        outputPath,
        format: ['json', 'md', 'stdout'],
      }),
    });

    //
    const jsonReport: Report = readReport();
    expect(jsonReport.plugins?.[0]?.slug).toBe('plg-0');
    expect(jsonReport.plugins?.[0]?.audits[0]?.slug).toBe('0a');
    //
    const mdReport = readFileSync(reportPath('md')).toString();
    expect(mdReport).toContain('# Code Pushup Report');
    //
    expect(logs.find(log => log.match(/Code Pushup Report/))).toBeTruthy();
  });

  it('should persist some formats`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({ outputPath, format: ['md', 'stdout'] }),
    });
    //
    expect(() => readFileSync(reportPath())).not.toThrow(
      'no such file or directory',
    );
    //
    const mdReport = readFileSync(reportPath('md')).toString();
    expect(mdReport).toContain('# Code Pushup Report');
    expect(logs.find(log => log.match(/Code Pushup Report/))).toBeTruthy();
  });

  it('should throw PersistDirError`', async () => {
    // @TODO
  });

  it('should throw PersistError`', async () => {
    // @TODO
  });
});

describe('logPersistedResults', () => {
  beforeEach(async () => {
    logs = [];
    mockConsole(msg => logs.push(msg));
  });
  afterEach(() => {
    logs = [];
    unmockConsole();
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
