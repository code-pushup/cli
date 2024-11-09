import { join } from 'node:path';
import { afterEach } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { omitVariableReportData } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('collect report with eslint-plugin NPM package', () => {
  const baseDir = 'static-environments/eslint-e2e-env/__tests__';

  afterEach(async () => {
    // await teardownTestFolder(baseDir);
  });

  it('should run ESLint plugin and create report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'collect',
        `--persist.outputDir=${join(baseDir, '.code-pushup')}`,
        '--no-progress',
        '--onlyPlugins=eslint',
      ],
      cwd: baseDir,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(join(baseDir, 'code-pushup/report.json'));

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
