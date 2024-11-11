import { join } from 'node:path';
import { afterEach } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { omitVariableReportData } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('collect report with eslint-plugin NPM package', () => {
  const envRoot = 'e2e/plugin-eslint-e2e/__test-env__';
  const outputDir = join(envRoot, '.code-pushup');

  afterEach(async () => {
    await teardownTestFolder(outputDir);
  });

  it('should run ESLint plugin and create report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'collect',
        '--no-progress',
        '--onlyPlugins=eslint',
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const report = await readJsonFile(join(outputDir, 'report.json'));

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
