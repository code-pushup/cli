import { join } from 'path';
import { beforeEach, vi } from 'vitest';
import { PluginReport, Report, reportSchema } from '@code-pushup/models';
import { executeProcess, readJsonFile, readTextFile } from '@code-pushup/utils';
import { setupFolder } from '../mocks/fs.mock';

describe('CLI collect', () => {
  const exampleCategoryTitle = 'Code style';
  const exampleAuditTitle =
    'Require `const` declarations for variables that are never reassigned after declared';

  const omitVariableData = ({
    date,
    duration,
    version,
    ...report
  }: Report | PluginReport) => report;

  const omitVariableReportData = (report: Report) =>
    omitVariableData({
      ...report,
      plugins: report.plugins.map(omitVariableData) as PluginReport[],
    });

  const cliPath = join('..', '..', 'dist', 'packages', 'cli');
  // @TODO use filename over outputDir
  const reportPath = join('tmp', 'react-todos-app');
  const reportFile = (filename: string, ext = 'json') =>
    join(reportPath, `${filename}.${ext}`);

  const filename = () => 'report';
  const baseArgs = [cliPath, 'collect', '--verbose', '--no-progress'];

  beforeEach(async () => {
    vi.clearAllMocks();
    setupFolder();
  });

  it('should run ESLint plugin and create report.json', async () => {
    const reportFileName = filename();
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [...baseArgs, `--persist.filename=${reportFileName}`],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(reportFile(reportFileName, 'json'));

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });

  it('should create report.md', async () => {
    const reportFileName = filename();
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        ...baseArgs,
        '--persist.format=md',
        `--persist.filename=${reportFileName}`,
      ],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const md = await readTextFile(reportFile(reportFileName, 'md'));

    expect(md).toContain('# Code PushUp Report');
    expect(md).toContain(exampleCategoryTitle);
    expect(md).toContain(exampleAuditTitle);
  });

  it('should print report summary to stdout', async () => {
    const reportFileName = filename();
    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: [
        ...baseArgs,
        '--persist.format=stdout',
        `--persist.filename=${reportFileName}`,
      ],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    expect(stdout).toContain('Code PushUp Report');
    expect(stdout).toContain('Generated reports');
    expect(stdout).toContain(reportFileName);
    expect(stdout).toContain(exampleCategoryTitle);
    expect(stdout).toContain(exampleAuditTitle);
  });
});
