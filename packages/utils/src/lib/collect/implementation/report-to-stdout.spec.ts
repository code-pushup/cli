import {coreConfigSchema, pluginConfigSchema, reportSchema,} from '@quality-metrics/models';
import {afterEach, beforeEach, describe} from 'vitest';
import {
  dummyConfig,
  dummyReport,
  nxValidatorsOnlyConfig,
  nxValidatorsOnlyReport,
  nxValidatorsPlugin,
} from './mock/config-and-report.mock';
import {reportToStdout} from "./report-to-stdout";
import {mockConsole, unmockConsole} from "./mock/helper.mock";

let logs = [];

describe('report-to-md', () => {

  beforeEach(async () => {
    logs = [];
    mockConsole(msg => logs.push(msg));
  });
  afterEach(() => {
    logs = [];
    unmockConsole();
  });

  // @NOTICE ATM the data structure changes a lot so this test is a temporarily check to see if the dummy data are correct
  it('test data is valid for report-to-md', () => {
    // dummy report
    expect(() => coreConfigSchema.parse(dummyConfig)).not.toThrow();
    expect(() => reportSchema.parse(dummyReport)).not.toThrow();
    // nx validators
    expect(() => pluginConfigSchema.parse(nxValidatorsPlugin())).not.toThrow();
    expect(() => coreConfigSchema.parse(nxValidatorsOnlyConfig)).not.toThrow();
    expect(() => reportSchema.parse(nxValidatorsOnlyReport)).not.toThrow();
  });

  it('Should contain all sections', () => {
    reportToStdout(dummyReport, dummyConfig);
    // headline
    expect(logs).toContain('Code Pushup Report');
    // meat information section
    expect(logs).toContain('Version');
    expect(logs).toContain('Date');
    expect(logs).toContain('Plugins');
    expect(logs).toContain('Audits');
    // overview section
    expect(logs).toContain('| Performance |');
    // details section
    expect(logs).toContain('**Performance ** (4/4)');
    expect(logs).toContain('<details>');
    // footer
    expect(logs).toContain('Code Pushup Cloud ID: [');
  });
});
