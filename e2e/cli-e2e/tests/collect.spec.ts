import { PluginReport, Report, reportSchema } from '@code-pushup/models';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

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

describe('CLI collect', () => {
  it('should run ESLint plugin and create report', async () => {
    await executeProcess({
      command: 'npx',
      args: ['../../dist/packages/cli', 'collect'],
      cwd: 'examples/react-todos-app',
    });

    const report = await readJsonFile('tmp/react-todos-app/report.json');

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
