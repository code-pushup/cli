import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { persistReport } from './persist';
import {
  mockCategory,
  mockConfig,
  mockPersistConfig,
  mockPluginConfig,
  mockReport,
} from './mock/schema-helper.mock';
import { readFileSync, unlinkSync } from 'fs';
import { Report } from '@quality-metrics/models';

import { mockConsole, unmockConsole } from './mock/helper.mock';

const outputPath = 'out';

const auditSlug1 = ['1a', '1b', '1c', '1d'];
const auditSlug2 = ['2a', '2b', '2c'];
const auditSlug3 = ['2a', '2b', '2c', '3d', '3e'];

const config = mockConfig();
config.plugins = [];
config.plugins.push(
  mockPluginConfig({ pluginSlug: 'plg-1', auditSlug: auditSlug1 }),
  mockPluginConfig({ pluginSlug: 'plg-2', auditSlug: auditSlug2 }),
  mockPluginConfig({ pluginSlug: 'plg-3', auditSlug: auditSlug3 }),
);

config.categories = [];
config.categories.push(
  mockCategory({
    pluginSlug: 'plg-1',
    categorySlug: 'performance',
    auditSlug: auditSlug1,
  }),
  mockCategory({
    pluginSlug: 'plg-2',
    categorySlug: 'a11y',
    auditSlug: auditSlug2,
  }),
  mockCategory({
    pluginSlug: 'plg-3',
    categorySlug: 'SEO',
    auditSlug: auditSlug3,
  }),
);

const report = mockReport({ pluginSlug: 'plg-1', auditSlug: auditSlug1 });

// to check if it is valid
//pluginConfigSchema.parse( mockPluginConfig(({pluginSlug: 'plg-1', auditSlug: auditSlug1})));
//categoryConfigSchema.parse(mockCategory({pluginSlug: 'plg-1', categorySlug: 'perf', auditSlug: auditSlug1 }));

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
    await persistReport(report, config);
    //  expect(console.log).toHaveBeenCalledTimes(configReportLogNum);
    //  expect(logs.find(msg => msg.match(/(erf)*(11)*(EO)*(validators)*/)),).toBeTruthy();
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
    await persistReport(report, {
      ...config,
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
