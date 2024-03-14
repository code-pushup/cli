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
        '--persist.outputDir=../../tmp/e2e/react-todos-app/history',
        '--no-progress',
        '--onlyPlugins=eslint',
        '--forceCleanStatus',
      ],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const outputDirFromRoot = join('tmp', 'e2e', 'react-todos-app', 'history');
    const reportPaths = await readdir(outputDirFromRoot);
    const results = await Promise.all([
      readJsonFile(join(outputDirFromRoot, reportPaths.at(0) as string)),
      readJsonFile(join(outputDirFromRoot, reportPaths.at(1) as string)),
      readJsonFile(join(outputDirFromRoot, reportPaths.at(2) as string)),
      readJsonFile(join(outputDirFromRoot, reportPaths.at(3) as string)),
      readJsonFile(join(outputDirFromRoot, reportPaths.at(4) as string)),
    ]);

    expect(results).toHaveLength(5);
    expect(() => reportSchema.parse(results.at(0))).not.toThrow();
    expect(() => reportSchema.parse(results.at(1))).not.toThrow();
    expect(() => reportSchema.parse(results.at(2))).not.toThrow();
    expect(() => reportSchema.parse(results.at(3))).not.toThrow();
    expect(() => reportSchema.parse(results.at(4))).not.toThrow();
  });
});
