import { join } from 'node:path';
import { createTreeWithEmptyWorkspace } from 'nx/src/generators/testing-utils/create-tree-with-empty-workspace';
import { afterEach, expect } from 'vitest';
import {
  type AuditReport,
  type PluginReport,
  type Report,
  reportSchema,
} from '@code-pushup/models';
import { generateCodePushupConfig } from '@code-pushup/nx-plugin';
import { materializeTree } from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';
import { createNpmWorkspace } from '../../create-cli-e2e/mocks/create-npm-workshpace';

/* eslint-disable @typescript-eslint/no-unused-vars */
const omitVariableAuditData = ({
  score,
  value,
  displayValue,
  ...auditReport
}: AuditReport) => auditReport;
const omitVariablePluginData = ({
  date,
  duration,
  version,
  audits,
  ...pluginReport
}: PluginReport) =>
  ({
    ...pluginReport,
    audits: audits.map(
      pluginReport.slug === 'lighthouse' ? omitVariableAuditData : p => p,
    ) as AuditReport[],
  } as PluginReport);
const omitVariableReportData = ({
  commit,
  date,
  duration,
  version,
  ...report
}: Report) => ({
  ...report,
  plugins: report.plugins.map(omitVariablePluginData),
});
/* eslint-enable @typescript-eslint/no-unused-vars */

async function setupWorkspace(cwd: string) {
  const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  generateCodePushupConfig(tree, '.', {
    fileImports: `import type {CoreConfig} from "@code-pushup/models";`,
    plugins: [
      {
        fileImports: `import lighthousePlugin from "@code-pushup/lighthouse-plugin";`,
        // @TODO fix ` hack, add support for string literals in generateCodePushupConfig
        codeStrings: 'lighthousePlugin(`https://example.com`)',
      },
    ],
  });
  await materializeTree(tree, cwd);
  await createNpmWorkspace(cwd);
}

describe('lighthouse-plugin NPM package', () => {
  const baseDir = 'tmp/e2e/plugin-lighthouse-e2e/__test__/report';

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  it('should run plugin over CLI and creates report.json', async () => {
    const cwd = join(baseDir, 'create-report');
    await setupWorkspace(cwd);
    const { code, stdout } = await executeProcess({
      command: 'code-pushup',
      args: ['collect', '--no-progress'],
      cwd,
    });

    expect(code).toBe(0);

    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('● Largest Contentful Paint');

    const report = await readJsonFile(join(cwd, '.code-pushup', 'report.json'));
    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
