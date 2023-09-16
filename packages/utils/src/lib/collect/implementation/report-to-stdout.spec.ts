import { afterEach, beforeEach, describe } from 'vitest';

import { mockConsole, unmockConsole } from './mock/helper.mock';
import { reportToStdout } from './report-to-stdout';
import {
  dummyConfig,
  dummyReport,
  nxValidatorsOnlyConfig,
  nxValidatorsOnlyReport,
} from '@quality-metrics/models/testing';

let logs: string[] = [];

describe('report-to-stdout', () => {
  beforeEach(async () => {
    logs = [];
    mockConsole(msg => logs.push(msg));
  });
  afterEach(() => {
    logs = [];
    unmockConsole();
  });

  it('should contain all sections when using dummy report', () => {
    reportToStdout(dummyReport, dummyConfig);
    // headline
    expect(logs.find(log => log.match(/Code Pushup Report/))).toBeTruthy();
    // meat information section
    expect(logs.find(log => log.match(/Version: [0-9a-z\-.]*/))).toBeTruthy();
    expect(logs.find(log => log.match(/Commit: (.*?)/))).toBeTruthy();
    expect(
      logs.find(log => log.match(/Date: [0-9a-zA-Z :\-()]*/)),
    ).toBeTruthy();
    expect(logs.find(log => log.match(/Duration: \d*ms/))).toBeTruthy();
    expect(logs.find(log => log.match(/Plugins: \d*/))).toBeTruthy();
    expect(logs.find(log => log.match(/Audits: \d*/))).toBeTruthy();
    // overview section
    expect(logs.find(log => log.match('|Category|Score|Audits|'))).toBeTruthy();
    expect(logs.find(log => log.match(/|Performance|(.*?)/))).toBeTruthy();
    // details section
    expect(logs.find(log => log.match(/Performance \d*/))).toBeTruthy();
    expect(logs.find(log => log.match(/- 0a title \(\d\)/))).toBeTruthy();
    // footer
    expect(
      logs.find(log => log.match('Made with ❤️ by code-pushup.dev')),
    ).toBeTruthy();
  });

  it('should contain all sections when using nx-validators report', () => {
    reportToStdout(nxValidatorsOnlyReport, nxValidatorsOnlyConfig);
    // headline
    expect(logs.find(log => log.match(/Code Pushup Report/))).toBeTruthy();
    // meat information section
    expect(logs.find(log => log.match(/Version: [0-9a-z\-.]*/))).toBeTruthy();
    expect(logs.find(log => log.match(/Commit: (.*?)/))).toBeTruthy();
    expect(
      logs.find(log => log.match(/Date: [0-9a-zA-Z :\-()]*/)),
    ).toBeTruthy();
    expect(logs.find(log => log.match(/Duration: \d*ms/))).toBeTruthy();
    expect(logs.find(log => log.match(/Plugins: \d*/))).toBeTruthy();
    expect(logs.find(log => log.match(/Audits: \d*/))).toBeTruthy();
    // overview section
    expect(logs.find(log => log.match('|Category|Score|Audits|'))).toBeTruthy();
    expect(logs.find(log => log.match(/|Performance|(.*?)/))).toBeTruthy();
    // details section
    expect(logs.find(log => log.match(/Use Nx Tooling \d*/))).toBeTruthy();
    expect(logs.find(log => log.match(/Use Quality Tooling \d*/))).toBeTruthy();
    expect(
      logs.find(log => log.match(/Normalize Typescript Config \d*/)),
    ).toBeTruthy();
    expect(
      logs.find(log => log.match(/Use Workspace Layout \d*/)),
    ).toBeTruthy();
    expect(
      logs.find(log => log.match(/- Check Version Mismatch \(\d\)/)),
    ).toBeTruthy();
    // footer
    expect(
      logs.find(log => log.match('Made with ❤️ by code-pushup.dev')),
    ).toBeTruthy();
  });
});
