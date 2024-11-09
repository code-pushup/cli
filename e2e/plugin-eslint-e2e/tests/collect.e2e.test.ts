import { join, relative } from 'node:path';
import { afterEach } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { omitVariableReportData } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('collect report with eslint-plugin NPM package', () => {
  const envRoot = 'static-environments/eslint-e2e-env';
  const baseDir = join(envRoot, '__tests__');

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  it('should run ESLint plugin and create report.json', async () => {
    const outputDir = relative(
      envRoot,
      join(baseDir, 'default-report', '.code-pushup'),
    );
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'collect',
        `--persist.outputDir=${outputDir}`,
        '--no-progress',
        '--onlyPlugins=eslint',
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(join(envRoot, outputDir, 'report.json'));

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
