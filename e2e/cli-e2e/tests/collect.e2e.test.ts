import { join } from 'node:path';
import { PluginReport, Report, reportSchema } from '@code-pushup/models';
import { cleanTestFolder } from '@code-pushup/testing-utils';
import { executeProcess, readJsonFile, readTextFile } from '@code-pushup/utils';

describe('CLI collect', () => {
  const exampleCategoryTitle = 'Code style';
  const exampleAuditTitle = 'Disallow unused variables';

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

  beforeEach(async () => {
    await cleanTestFolder('tmp/e2e');
  });

  it('should run ESLint plugin and create report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'code-pushup',
      args: ['collect', '--no-progress'],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile('tmp/react-todos-app/report.json');

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });

  it('should run Code coverage plugin and create report.json', async () => {
    /**
     * The stats passed in the fixture are as follows
     * 3 files: one partially covered, one with no coverage, one with full coverage
     * Functions:  2 +  1 +  2 found |   1 +  0 +  2 covered (60% coverage)
     * Branches:  10 +  2 +  5 found |   8 +  0 +  5 covered (76% coverage)
     * Lines:     10 +  5 + 10 found |   7 +  0 + 10 covered (68% coverage)
     */

    const configPath = join(
      'e2e',
      'cli-e2e',
      'mocks',
      'fixtures',
      'code-pushup.config.coverage.ts',
    );

    const { code, stderr } = await executeProcess({
      command: 'code-pushup',
      args: [
        'collect',
        '--no-progress',
        `--config=${configPath}`,
        `--persist.outputDir=tmp/e2e`,
      ],
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(join('tmp', 'e2e', 'report.json'));

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

    const md = await readTextFile('tmp/react-todos-app/report.md');

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
