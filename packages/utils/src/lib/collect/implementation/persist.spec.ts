import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { persistReport } from './persist';
import {
  mockConfig,
  mockPersistConfig,
  mockReport,
} from './mock/schema-helper.mock';
import { readFileSync, unlinkSync } from 'fs';
import { Report } from '@quality-metrics/models';

import { mockConsole, unmockConsole } from './mock/helper.mock';

const outputPath = 'out';

const categorySlug = ['performance', 'a11y', 'SEO', 'nx-validators'];
const report = mockReport();
const config = mockConfig({ outputPath, categorySlug });
const configReportLogNum = categorySlug.length;

let logs: string[] = [];

describe('persistReport', () => {
  beforeEach(async () => {
    try {
      unlinkSync(outputPath + '.json');
    } catch (_) {
      void 0;
    }

    try {
      unlinkSync(outputPath + '.md');
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
    await persistReport(report, config);
    expect(console.log).toHaveBeenCalledTimes(configReportLogNum);
    expect(
      logs.find(msg => msg.match(/(erformance)*(11)*(EO)*(validators)*/)),
    ).toBeTruthy();
    //
    expect(() => readFileSync(outputPath + '.json')).toThrow(
      'no such file or directory',
    );
    expect(() => readFileSync(outputPath + '.md')).toThrow(
      'no such file or directory',
    );
  });

  it('should log to console when format is stdout`', async () => {
    await persistReport(report, {
      ...config,
      persist: mockPersistConfig({ outputPath, format: ['stdout'] }),
    });
    expect(console.log).toHaveBeenCalledTimes(configReportLogNum);
    expect(
      logs.find(msg => msg.match(/(erformance)*(11)*(EO)*(validators)*/)),
    ).toBeTruthy();
    //
    expect(() => readFileSync(outputPath + '.json')).toThrow(
      'no such file or directory',
    );
    expect(() => readFileSync(outputPath + '.md')).toThrow(
      'no such file or directory',
    );
  });

  it('should persist json format`', async () => {
    await persistReport(report, {
      ...config,
      persist: mockPersistConfig({ outputPath, format: ['json'] }),
    });
    const jsonReport: Report = JSON.parse(
      readFileSync(outputPath + '.json').toString(),
    );
    expect(jsonReport.plugins?.[0]?.meta.slug).toBe('mock-plugin-slug');
    expect(jsonReport.plugins?.[0]?.audits[0]?.slug).toBe('mock-audit-slug');
    //
    expect(console.log).toHaveBeenCalledTimes(0);
    expect(() => readFileSync(outputPath + '.md')).toThrow(
      'no such file or directory',
    );
  });

  it('should persist md format`', async () => {
    await persistReport(report, {
      ...config,
      persist: mockPersistConfig({ outputPath, format: ['md'] }),
    });
    const mdReport = readFileSync(outputPath + '.md').toString();
    expect(mdReport).toContain('# Code Pushup Report');
    //
    expect(console.log).toHaveBeenCalledTimes(0);
    expect(() => readFileSync(outputPath + '.json')).toThrow(
      'no such file or directory',
    );
  });

  it('should persist all formats`', async () => {
    await persistReport(report, {
      ...config,
      persist: mockPersistConfig({
        outputPath,
        format: ['json', 'md', 'stdout'],
      }),
    });

    //
    const jsonReport: Report = JSON.parse(
      readFileSync(outputPath + '.json').toString(),
    );
    expect(jsonReport.plugins?.[0]?.meta.slug).toBe('mock-plugin-slug');
    expect(jsonReport.plugins?.[0]?.audits[0]?.slug).toBe('mock-audit-slug');
    //
    const mdReport = readFileSync(outputPath + '.md').toString();
    expect(mdReport).toContain('# Code Pushup Report');
    //
    expect(console.log).toHaveBeenCalledTimes(configReportLogNum);
    expect(
      logs.find(msg => msg.match(/(erformance)*(11)*(EO)*(validators)*/)),
    ).toBeTruthy();
  });

  it('should persist some formats`', async () => {
    await persistReport(report, {
      ...config,
      persist: mockPersistConfig({ outputPath, format: ['md', 'stdout'] }),
    });
    //
    expect(() => readFileSync(outputPath + '.json')).toThrow(
      'no such file or directory',
    );
    //
    const mdReport = readFileSync(outputPath + '.md').toString();
    expect(mdReport).toContain('# Code Pushup Report');
    //
    expect(console.log).toHaveBeenCalledTimes(configReportLogNum);
    expect(
      logs.find(msg => msg.match(/(erformance)*(11)*(EO)*(validators)*/)),
    ).toBeTruthy();
  });

  it('should throw PersistDirError`', async () => {
    // @TODO
  });

  it('should throw PersistError`', async () => {
    // @TODO
  });
});
