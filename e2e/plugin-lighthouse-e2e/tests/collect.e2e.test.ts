import { join } from 'node:path';
import {
  createTreeWithEmptyV1Workspace,
  createTreeWithEmptyWorkspace,
} from 'nx/src/generators/testing-utils/create-tree-with-empty-workspace';
import { afterEach, expect } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { generateCodePushupConfig } from '@code-pushup/nx-plugin';
import { materializeTree } from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import {
  createNpmWorkspace,
  omitVariableReportData,
  removeColorCodes,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

async function setupWorkspace(cwd: string) {
  // @TODO create empty tree without workspace
  const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  generateCodePushupConfig(tree, '.', {
    fileImports: 'import type {CoreConfig} from "@code-pushup/models";',
    plugins: [
      {
        fileImports: [
          'import lighthousePlugin from "@code-pushup/lighthouse-plugin";',
          'import { DEFAULT_FLAGS } from "chrome-launcher/dist/flags.js";',
        ],
        // @TODO fix ` hack, add support for string literals in generateCodePushupConfig
        codeStrings: `await lighthousePlugin(\`https://codepushup.dev/\`, {
      onlyAudits: [
        // performance category
        \`largest-contentful-paint\`,
        // a11y category
        \`aria-allowed-attr\`,
        // best-practices category
        \`deprecations\`,
        // seo category
        \`hreflang\`,
      ],
      chromeFlags: DEFAULT_FLAGS.concat([\`--headless\`]),
    }),`,
      },
    ],
  });
  await materializeTree(tree, cwd);
  await createNpmWorkspace(cwd);
}

describe('collect report with lighthouse-plugin NPM package', () => {
  const baseDir = 'tmp/e2e/plugin-lighthouse-e2e/__test__/report';

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  it('should run plugin over CLI and creates report.json', async () => {
    const cwd = join(baseDir, 'create-report');
    await setupWorkspace(cwd);
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
