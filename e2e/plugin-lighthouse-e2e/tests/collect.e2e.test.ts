import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { cleanTestFolder, teardownTestFolder } from '@code-pushup/test-setup';
import {
  omitVariableReportData,
  removeColorCodes,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

const defaultConfigContent = await readFile(
  join(
    process.cwd(),
    'e2e/plugin-lighthouse-e2e/mocks/fixtures/code-pushup.config.lh-default.ts',
  ),
  { encoding: 'utf8' },
);

async function addCodePushupConfig(target: string) {
  await cleanTestFolder(target);
  await writeFile(join(target, 'code-pushup.config.ts'), defaultConfigContent);
}

describe('collect report with lighthouse-plugin NPM package', () => {
  const baseDir = 'tmp/e2e/plugin-lighthouse-e2e/__test__';

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  it('should run plugin over CLI and creates report.json', async () => {
    const cwd = join(baseDir, 'create-report');
    await addCodePushupConfig(cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('● Largest Contentful Paint');

    const report = await readJsonFile(join(cwd, '.code-pushup', 'report.json'));
    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(
      omitVariableReportData(report as Report, { omitAuditData: true }),
    ).toMatchSnapshot();
  });
});
