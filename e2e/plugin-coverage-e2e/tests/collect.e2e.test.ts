import {dirname, join} from 'node:path';
import {afterEach} from 'vitest';
import {teardownTestFolder} from '@code-pushup/test-setup';
import {fileURLToPath} from "node:url";
import {executeProcess, readJsonFile} from "@code-pushup/utils";
import {type Report, reportSchema} from "@code-pushup/models";
import {omitVariableReportData} from "@code-pushup/test-utils";

describe('collect report with coverage-plugin NPM package', () => {
  const envRoot = 'static-environments/coverage-e2e-env';
  const baseDir = join(envRoot, '__tests__');

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  it('should run Code coverage plugin which collects passed results and creates report.json', async () => {
    /**
     * The stats passed in the fixture are as follows
     * 3 files: one partially covered, one with no coverage, one with full coverage
     * Functions:  2 +  1 +  2 found |   1 +  0 +  2 covered (60% coverage)
     * Branches:  10 +  2 +  5 found |   8 +  0 +  5 covered (76% coverage)
     * Lines:     10 +  5 + 10 found |   7 +  0 + 10 covered (68% coverage)
     */

    const configPath = join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      'mocks',
      'fixtures',
      'code-pushup.config.ts',
    );

    const {code, stderr} = await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'collect',
        '--no-progress',
        `--config=${configPath}`,
        '--persist.outputDir=tmp/e2e',
        '--onlyPlugins=coverage',
      ],
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(join(envRoot, 'e2e', 'report.json'));

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });

  it('should run Code coverage plugin that runs coverage tool and creates report.json', async () => {
    const {code, stderr} = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress', '--onlyPlugins=coverage'],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(join(envRoot, '.code-pushup/report.json'));

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });


});
