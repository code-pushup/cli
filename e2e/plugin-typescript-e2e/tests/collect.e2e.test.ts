import path from 'node:path';
import { afterAll, beforeAll, expect } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import {
  omitVariableReportData,
  osAgnosticAuditOutputs,
} from '@code-pushup/test-fixtures';
import {
  TEST_OUTPUT_DIR,
  type TestEnvironment,
  osAgnosticPath,
  setupTestEnvironment,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

function sanitizeReportPaths(report: Report): Report {
  return {
    ...report,
    plugins: report.plugins.map(plugin => ({
      ...plugin,
      audits: osAgnosticAuditOutputs(plugin.audits, message =>
        message.replace(
          /['"]([^'"]*[/\\][^'"]*)['"]/g,
          (fullMatch: string, capturedPath: string) => {
            const osAgnostic = osAgnosticPath(capturedPath);
            // Only replace directory paths, not .ts file paths
            if (capturedPath.endsWith('.ts')) {
              return `'${osAgnostic}'`;
            }
            // on Windows the path starts from "plugin-typescript-e2e/src" not "./". This normalizes it to "./<segment>"
            return `'${['.', osAgnostic.split('/').slice(-1)].join('/')}'`;
          },
        ),
      ),
    })),
  };
}

describe('PLUGIN collect report with typescript-plugin NPM package', () => {
  let testEnv: TestEnvironment;
  let envRoot: string;
  let distRoot: string;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment(
      ['..', 'mocks', 'fixtures', 'default-setup'],
      {
        callerUrl: import.meta.url,
      },
    );
    envRoot = testEnv.baseDir;
    distRoot = path.join(envRoot, TEST_OUTPUT_DIR);
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should run plugin over CLI and creates report.json', async () => {
    const outputDir = path.join(
      path.relative(envRoot, distRoot),
      'create-report',
      '.code-pushup',
    );

    const { code } = await executeProcess({
      command: 'npx',
      // verbose exposes audits with perfect scores that are hidden in the default stdout
      args: [
        '@code-pushup/cli',
        'collect',
        '--verbose',
        `--persist.outputDir=${outputDir}`,
      ],
      cwd: envRoot,
    });

    expect(code).toBe(0);

    const reportJson = await readJsonFile<Report>(
      path.join(envRoot, outputDir, 'report.json'),
    );
    expect(() => reportSchema.parse(reportJson)).not.toThrow();

    expect(
      omitVariableReportData(sanitizeReportPaths(reportJson)),
    ).toMatchSnapshot();
  });
});
