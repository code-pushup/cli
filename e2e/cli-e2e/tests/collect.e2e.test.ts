import type { AuditReport, PluginReport, Report } from '@code-pushup/models';
import { cleanTestFolder } from '@code-pushup/test-setup';
import { executeProcess, readTextFile } from '@code-pushup/utils';

describe('CLI collect', () => {
  const exampleCategoryTitle = 'Code style';
  const exampleAuditTitle = 'Disallow unused variables';

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const omitVariableAuditData = ({
    score,
    value,
    displayValue,
    ...auditReport
  }: AuditReport) => auditReport;
  const omitVariablePluginData = ({
    date,
    duration,
    version,
    audits,
    ...pluginReport
  }: PluginReport) =>
    ({
      ...pluginReport,
      audits: audits.map(
        pluginReport.slug === 'lighthouse' ? omitVariableAuditData : p => p,
      ) as AuditReport[],
    }) as PluginReport;
  const omitVariableReportData = ({
    commit,
    date,
    duration,
    version,
    ...report
  }: Report) => ({
    ...report,
    plugins: report.plugins.map(omitVariablePluginData),
  });
  /* eslint-enable @typescript-eslint/no-unused-vars */

  beforeEach(async () => {
    await cleanTestFolder('tmp/e2e/react-todos-app');
  });

  it('should create report.md', async () => {
    const { code, stderr } = await executeProcess({
      command: 'code-pushup',
      args: ['collect', '--persist.format=md', '--no-progress'],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const md = await readTextFile('tmp/e2e/react-todos-app/report.md');

    expect(md).toContain('# Code PushUp Report');
    expect(md).toContain(exampleCategoryTitle);
    expect(md).toContain(exampleAuditTitle);
  });

  it('should print report summary to stdout', async () => {
    const { code, stdout, stderr } = await executeProcess({
      command: 'code-pushup',
      args: ['collect', '--no-progress'],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    expect(stdout).toContain('Code PushUp Report');
    expect(stdout).not.toContain('Generated reports');
    expect(stdout).toContain(exampleCategoryTitle);
    expect(stdout).toContain(exampleAuditTitle);
  });
});
