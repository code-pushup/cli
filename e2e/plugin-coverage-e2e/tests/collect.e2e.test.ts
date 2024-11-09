import { join } from 'node:path';
import { afterEach } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { omitVariableReportData } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('collect report with coverage-plugin NPM package', () => {
  const envRoot = 'static-environments/coverage-e2e-env';
  const baseDir = join(envRoot, '__tests__');

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  it('should run Code coverage plugin which collects passed results and creates report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'collect',
        '--no-progress',
        `--config=code-pushup.existing-report.config.ts`,
        '--onlyPlugins=coverage',
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(
      join(envRoot, '.code-pushup', 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });

  it('should run Code coverage plugin that runs coverage tool and creates report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'collect',
        '--no-progress',
        '--onlyPlugins=coverage',
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(
      join(envRoot, '.code-pushup/report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
