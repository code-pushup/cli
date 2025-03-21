import { cp } from 'node:fs/promises';
// eslint-disable-next-line unicorn/import-style
import path, { join } from 'node:path';
import { afterAll, beforeAll, expect } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  omitVariableReportData,
  osAgnosticPath,
  removeColorCodes,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('PLUGIN collect report with typescript-plugin NPM package', () => {
  const envRoot = join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const distRoot = join(envRoot, TEST_OUTPUT_DIR);

  const fixturesDir = join(
    'e2e',
    nxTargetProject(),
    'mocks',
    'fixtures',
    'default-setup',
  );

  beforeAll(async () => {
    await cp(fixturesDir, envRoot, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestFolder(distRoot);
  });

  it('should run plugin over CLI and creates report.json', async () => {
    const outputDir = join(
      path.relative(envRoot, distRoot),
      'create-report',
      '.code-pushup',
    );

    const { code, stdout } = await executeProcess({
      command: 'npx',
      // verbose exposes audits with perfect scores that are hidden in the default stdout
      args: [
        '@code-pushup/cli',
        'collect',
        '--no-progress',
        '--verbose',
        `--persist.outputDir=${outputDir}`,
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);

    expect(cleanStdout).toMatch(/● Semantic errors\s+\d+ issue/);
    expect(cleanStdout).toMatch(/● Configuration errors\s+\d+ issue/);
    expect(cleanStdout).toMatch(
      /● Declaration and language service errors\s+\d+ issue/,
    );
    expect(cleanStdout).toMatch(/● Syntax errors\s+\d+ issue/);
    expect(cleanStdout).toMatch(/● Internal errors\s+\d+ issue/);
    expect(cleanStdout).toMatch(/● No implicit any errors\s+\d+ issue/);

    const reportJson = await readJsonFile<Report>(
      join(envRoot, outputDir, 'report.json'),
    );
    expect(() => reportSchema.parse(reportJson)).not.toThrow();
    expect({
      ...omitVariableReportData(reportJson, { omitAuditData: false }),
      plugins: reportJson.plugins.map(plugin => ({
        ...plugin,
        audits: plugin.audits.map(audit => ({
          ...audit,
          details: {
            ...audit.details,
            issues: (audit?.details?.issues ?? []).map(
              ({ message, ...issue }) => ({
                ...issue,
                source: {
                  ...issue.source,
                  ...(issue?.source?.file
                    ? { file: osAgnosticPath(issue?.source?.file) }
                    : {}),
                },
              }),
            ),
          },
        })),
      })),
    }).toMatchFileSnapshot('__snapshots__/typescript-plugin-json-report.json');
  });
});
