import { PluginReport, Report, reportSchema } from '@code-pushup/models';
import { executeProcess, readJsonFile, readTextFile } from '@code-pushup/utils';

describe('CLI collect', () => {
  const exampleCategoryTitle = 'Code style';
  const exampleAuditTitle = 'Require `const` declarations for variables';

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const omitVariableData = ({
    date,
    duration,
    version,
    ...report
  }: Report | PluginReport) => report;
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const omitVariableReportData = (report: Report) =>
    omitVariableData({
      ...report,
      plugins: report.plugins.map(omitVariableData) as PluginReport[],
    });

  it('should run ESLint plugin and create report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'code-pushup',
      args: ['collect', '--no-progress'],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile('examples/react-todos-app/.code-pushup/report.json');

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });

  it('should create report.md', async () => {
    const { code, stderr } = await executeProcess({
      command: 'code-pushup',
      args: ['collect', '--persist.format=md', '--no-progress'],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const md = await readTextFile('examples/react-todos-app/.code-pushup/report.md');

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
