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
  // @NOTICE ATM the data structure changes a lot so this test is a temporarily check to see if the dummy data are correct.
  // It will get removes as soo as the structure stabelized
  it('test data is valid to be used for tests', () => {
    // Dummy Report
    expect(() => coreConfigSchema.parse(dummyConfig)).not.toThrow();
    expect(() => reportSchema.parse(dummyReport)).not.toThrow();
    // Nx-Validators Report
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
    expect(mdReport).toContain('_Duration');
    expect(mdReport).toContain('_Plugins');
    expect(mdReport).toContain('_Audits');
    // overview section
    expect(mdReport).toContain('Category|Score|Audits');
    // details section
    expect(mdReport).toContain('**Performance');
    expect(mdReport).toContain('**A11y');
    expect(mdReport).toContain('**Seo');
    expect(mdReport).toContain('<details>');
    // footer
    expect(mdReport).toContain('Made with ❤️ by [code-pushup.dev](code-pushup.dev)');
  });
});
