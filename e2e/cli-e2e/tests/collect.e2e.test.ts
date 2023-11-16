import { afterEach, beforeEach, vi } from 'vitest';
import { PluginReport, Report, reportSchema } from '@code-pushup/models';
import { executeProcess, readJsonFile, readTextFile } from '@code-pushup/utils';
import { cleanFolderPutGitKeep } from '../mocks/fs.mock';

describe('CLI collect', () => {
  const exampleCategoryTitle = 'Code style';
  const exampleAuditTitle = 'Require `const` declarations for variables';

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

  beforeEach(async () => {
    vi.clearAllMocks();
    cleanFolderPutGitKeep();
  });

  afterEach(() => {
    cleanFolderPutGitKeep();
  });

  it('should run ESLint plugin and create report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '--yes',
        '--quiet',
        '-p',
        '@code-pushup/cli@e2e',
        'code-pushup',
        'collect',
        '--no-progress',
      ],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile('tmp/react-todos-app/report.json');

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  }, 120000);

  it('should create report.md', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '--yes',
        '--quiet',
        '-p',
        '@code-pushup/cli@e2e',
        'code-pushup',
        'collect',
        '--persist.format=md',
        '--no-progress',
      ],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const md = await readTextFile('tmp/react-todos-app/report.md');

    expect(md).toContain('# Code PushUp Report');
    expect(md).toContain(exampleCategoryTitle);
    expect(md).toContain(exampleAuditTitle);
  }, 120000);

  it('should print report summary to stdout', async () => {
    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '--yes',
        '--quiet',
        '-p',
        '@code-pushup/cli@e2e',
        'code-pushup',
        'collect',
        '--verbose',
        '--persist.format=stdout',
        '--no-progress',
      ],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    expect(stdout).toContain('Code PushUp Report');
    expect(stdout).toContain('Generated reports');
    expect(stdout).toContain('report.json');
    expect(stdout).toContain(exampleCategoryTitle);
    expect(stdout).toContain(exampleAuditTitle);
  }, 120000);
});
