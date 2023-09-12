import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { persistReport } from './persist';
import { mockPersistConfig } from './mock/schema-helper.mock';
import { readFileSync, unlinkSync } from 'fs';
import { Report } from '@quality-metrics/models';
import { mockConsole, unmockConsole } from './mock/helper.mock';
import { dummyConfig, dummyReport } from './mock/config-and-report.mock';

const outputPath = 'out';

const configReportLogNum = 0; // @TODO this is wrong. log is actually called

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
    /*
     console.log('config.plugins.0.meta', config.plugins[0]?.meta)
     console.log('config.plugins.0.audits', config.plugins[0]?.audits)
     console.log('config.categories.0.slug', config.categories[0]?.slug)
     console.log('config.categories.0.refs.0.plugin', config.categories[0]?.refs[0]?.plugin)
     console.log('config.categories.0.refs.0.slug', config.categories[0]?.refs[0]?.slug)
     console.log('report.plugins.0.audits.0.slug', report.plugins[0]?.meta.slug)
     console.log('report.plugins.0.audits.0.slug', report.plugins[0]?.audits[0]?.slug)
    */
    await persistReport(dummyReport, dummyConfig);
    //  expect(console.log).toHaveBeenCalledTimes(configReportLogNum);
    //  expect(logs.find(msg => msg.match(/(erf)*(11)*(EO)*(validators)*/)),).toBeTruthy();

    expect(() => readFileSync(outputPath + '.json')).toThrow(
      'no such file or directory',
    );
    expect(() => readFileSync(outputPath + '.md')).toThrow(
      'no such file or directory',
    );
  });

  it('should log to console when format is stdout`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({ outputPath, format: ['stdout'] }),
    });
    /*
    expect(console.log).toHaveBeenCalledTimes(configReportLogNum);
    expect(
      logs.find(msg => msg.match(/(erformance)*(11)*(EO)*(validators))),
    ).toBeTruthy();
    */
    //
    expect(() => readFileSync(outputPath + '.json')).toThrow(
      'no such file or directory',
    );
    expect(() => readFileSync(outputPath + '.md')).toThrow(
      'no such file or directory',
    );
  });

  it('should persist json format`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({ outputPath, format: ['json'] }),
    });
    const jsonReport: Report = JSON.parse(
      readFileSync(outputPath + '.json').toString(),
    );
    expect(jsonReport.plugins?.[0]?.meta.slug).toBe('plg-1');
    expect(jsonReport.plugins?.[0]?.audits[0]?.slug).toBe('1a');
    //
    expect(console.log).toHaveBeenCalledTimes(0);
    expect(() => readFileSync(outputPath + '.md')).toThrow(
      'no such file or directory',
    );
  });

  it('should persist md format`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
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
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({
        outputPath,
        format: ['json', 'md', 'stdout'],
      }),
    });

    //
    const jsonReport: Report = JSON.parse(
      readFileSync(outputPath + '.json').toString(),
    );
    expect(jsonReport.plugins?.[0]?.meta.slug).toBe('plg-1');
    expect(jsonReport.plugins?.[0]?.audits[0]?.slug).toBe('1a');
    //
    const mdReport = readFileSync(outputPath + '.md').toString();
    expect(mdReport).toContain('# Code Pushup Report');
    //
    /* expect(console.log).toHaveBeenCalledTimes(configReportLogNum);
     expect(
       logs.find(msg => msg.match(/(erformance)*(11)*(EO)*(validators))),
     ).toBeTruthy(); */
  });

  it('should persist some formats`', async () => {
    await persistReport(dummyReport, {
      ...dummyConfig,
      persist: mockPersistConfig({ outputPath, format: ['md', 'stdout'] }),
    });
    //
    expect(() => readFileSync(outputPath + '.json')).toThrow(
      'no such file or directory',
    );
    //
    const mdReport = readFileSync(outputPath + '.md').toString();
    expect(mdReport).toContain('# Code Pushup Report');
    /*
    expect(console.log).toHaveBeenCalledTimes(configReportLogNum);
    expect(
      logs.find(msg => msg.match(/(erformance)*(11)*(EO)*(validators)*)),
    ).toBeTruthy(); */
  });

  it('should throw PersistDirError`', async () => {
    // @TODO
  });

  it('should throw PersistError`', async () => {
    // @TODO
  });
});
