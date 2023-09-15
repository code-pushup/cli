import {describe} from 'vitest';
import {dummyConfig, dummyReport, nxValidatorsOnlyConfig, nxValidatorsOnlyReport,} from './mock/config-and-report.mock';
import {reportToMd} from './report-to-md';

describe('report-to-md', () => {

  it('Should contain all sections when using dummy report', () => {
    const mdReport = reportToMd(dummyReport, dummyConfig);
    // headline
    expect(mdReport).toContain('Code Pushup Report');
    // meat information section
    expect(mdReport).toMatch(/_Version: [0-9a-z\-.]*_/);
    expect(mdReport).toMatch(/_Commit: (.*?)_/);
    expect(mdReport).toMatch(/_Date: [0-9a-zA-Z :\-()]*_/);
    expect(mdReport).toMatch(/_Duration: \d*ms_/);
    expect(mdReport).toMatch(/_Plugins: \d*_/);
    expect(mdReport).toMatch(/_Audits: \d*_/);
    // overview section
    expect(mdReport).toContain('|Category|Score|Audits|');
    expect(mdReport).toMatch(/|Performance|(.*?)/);
    // details section
    expect(mdReport).toMatch(/\*\*Performance \d*\*\*/);
    expect(mdReport).toMatch(/\*\*A11y \d*\*\*/);
    expect(mdReport).toMatch(/\*\*Seo \d*\*\*/);
    expect(mdReport).toMatch(/<summary>audit title \(\d\)<\/summary>/);
    // footer
    expect(mdReport).toContain('Made with ❤️ by [code-pushup.dev](code-pushup.dev)');
  });

  it('Should contain all sections when using nx-validators report', () => {
    const mdReport = reportToMd(nxValidatorsOnlyReport, nxValidatorsOnlyConfig);
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
    expect(mdReport).toContain('**Use Nx Tooling');
    expect(mdReport).toContain('**Use Quality Tooling');
    expect(mdReport).toContain('**Normalize Typescript Config');
    expect(mdReport).toContain('**Use Workspace Layout');
    expect(mdReport).toMatch(/<summary>Check Version Mismatch \(\d\)<\/summary>/);
    // footer
    expect(mdReport).toContain('Made with ❤️ by [code-pushup.dev](code-pushup.dev)');
  });
});
