import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { PluginReport, Report, reportSchema } from '@code-pushup/models';
import { cleanTestFolder } from '@code-pushup/test-setup';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('CLI history', () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const omitVariableData = ({
    date,
    duration,
    version,
    ...report
  }: Omit<Report, 'commit'> | PluginReport) => report;
  const omitVariableReportData = ({ commit, ...report }: Report) =>
    omitVariableData({
      ...report,
      plugins: report.plugins.map(omitVariableData) as PluginReport[],
    });
  /* eslint-enable @typescript-eslint/no-unused-vars */

  beforeEach(async () => {
    await cleanTestFolder('tmp/e2e');
  });

  it('should run ESLint plugin and create report.json for the last 5 commits', async () => {
    const { code, stderr } = await executeProcess({
      command: 'code-pushup',
      args: [
        'history',
        '--no-progress',
        '--onlyPlugins=eslint',
        '--forceCleanStatus',
      ],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

   const outputDirFromRoot = join('tmp', 'e2e', 'react-todos-app');
    const reportPaths = await readdir(outputDirFromRoot);
    const results = await Promise.all(
      reportPaths.map(path => readJsonFile(join(outputDirFromRoot, path))),
    );

    expect(results).toHaveLength(1);
    results.forEach(report => {
      expect(() => reportSchema.parse(report)).not.toThrow();
    });
  });
});
