import { join } from 'path';
import { PluginReport, Report, reportSchema } from '@code-pushup/models';
import {
  CliArgsObject,
  executeProcess,
  objectToCliArgs,
  readJsonFile,
} from '@code-pushup/utils';

const configFile = (ext: 'ts' | 'js' | 'mjs') =>
  join(process.cwd(), `e2e/cli-e2e/mocks/code-pushup.config.${ext}`);

const execCli = (argObj: Partial<CliArgsObject>) =>
  executeProcess({
    command: 'node',
    args: objectToCliArgs({
      _: './dist/packages/cli/index.js',
      verbose: true,
      ...argObj,
    }),
  });

// TODO: custom matcher for report
const replaceVariableData = ({
  date,
  duration,
  version,
  ...report
}: Report | PluginReport) => report;

const cleanReport = (report: Report) =>
  replaceVariableData({
    ...report,
    plugins: report.plugins.map(replaceVariableData) as PluginReport[],
  });

describe('CLI', () => {
  describe('collect', () => {
    it('should run ESLint plugin and create report', async () => {
      await executeProcess({
        command: 'npx',
        args: ['../../dist/packages/cli', 'collect'],
        cwd: 'examples/react-todos-app',
      });

      const report = await readJsonFile('tmp/react-todos-app/report.json');

      expect(() => reportSchema.parse(report)).not.toThrow();
      expect(cleanReport(report as Report)).toMatchSnapshot();
    });
  });

  // it('should load .js config file', async () => {
  //   await execCli({ config: configFile('js') });
  // });

  // it('should load .mjs config file', async () => {
  //   await execCli({ config: configFile('mjs') });
  // });

  // it('should load .ts config file', async () => {
  //   await execCli({ config: configFile('ts') });
  // });
});
