import {
  coreConfigSchema,
  pluginConfigSchema,
  reportSchema,
} from '@quality-metrics/models';
import { describe } from 'vitest';
import {
  dummyConfig,
  dummyReport,
  nxValidatorsOnlyConfig,
  nxValidatorsPlugin,
  nxValidatorsOnlyReport,
} from './mock/config-and-report.mock';
import { reportToMd } from './report-to-md';

describe('report-to-md', () => {
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
    const mdReport = reportToMd(dummyReport, dummyConfig);
    // headline
    expect(mdReport).toContain('Code Pushup Report');
    // meat information section
    expect(mdReport).toContain('_Version');
    expect(mdReport).toContain('_Date');
    expect(mdReport).toContain('_Plugins');
    expect(mdReport).toContain('Audits');
    // overview section
    expect(mdReport).toContain('Performance|');
    // details section
    expect(mdReport).toContain('**Performance');
    expect(mdReport).toContain('<details>');
    // footer
    expect(mdReport).toContain('Code Pushup Cloud ID: [');
  });
});
