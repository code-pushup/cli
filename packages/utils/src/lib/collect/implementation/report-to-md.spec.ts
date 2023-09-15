import { describe } from 'vitest';
import { reportToMd } from './report-to-md';
import {
  lighthouseConfig,
  lighthouseReport,
  dummyConfig, dummyReport,
  nxValidatorsOnlyConfig,
  nxValidatorsOnlyReport,
} from '@quality-metrics/models/testing';

describe('report-to-md', () => {
  it('should contain all sections when using dummy report', () => {
    const mdReport = reportToMd(dummyReport, dummyConfig);
    // headline
    expect(mdReport).toContain('Code Pushup Report');
    // meat information section
    expect(mdReport).toMatch(/_Version: [0-9a-z\-.]*_/);
    expect(mdReport).toMatch(/_Commit: (.*?)_/);
    expect(mdReport).toMatch(/_Date: (.*?)_/);
    expect(mdReport).toMatch(/_Duration: \d*ms_/);
    expect(mdReport).toMatch(/_Plugins: \d*_/);
    expect(mdReport).toMatch(/_Audits: \d*_/);
    // overview section
    expect(mdReport).toContain('|Category|Score|Audits|');
    expect(mdReport).toMatch(/|Performance|(.*?)/);
    // details section
    expect(mdReport).toMatch(/\*\*Performance \d*\*\*/);
    expect(mdReport).toMatch(
      /<summary>audit title \(\d\) (execute plugin)<\/summary>/,
    );
    // footer
    expect(mdReport).toContain(
      'Made with ❤️ by [code-pushup.dev](code-pushup.dev)',
    );
  });

  it('should contain all sections when using nx-validators report', () => {
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
    expect(mdReport).toMatch(
      /<summary>Check Version Mismatch \(\d\) NxValidatorsPlugin<\/summary>/,
    );
    // footer
    expect(mdReport).toContain(
      'Made with ❤️ by [code-pushup.dev](code-pushup.dev)',
    );
  });

  it('should contain all sections when using light report', () => {
    const mdReport = reportToMd(lighthouseReport, lighthouseConfig);
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
    expect(mdReport).toContain('**Accessibility');
    expect(mdReport).toContain('**Best Practices');
    expect(mdReport).toContain('**SEO');
    expect(mdReport).toContain('**PWA');
    expect(mdReport).toContain('<summary>Time to Interactive');
    // footer
    expect(mdReport).toContain(
      'Made with ❤️ by [code-pushup.dev](code-pushup.dev)',
    );
  });
});
