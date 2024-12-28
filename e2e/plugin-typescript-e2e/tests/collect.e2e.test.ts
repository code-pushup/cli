import {cp} from 'node:fs/promises';
import path from 'node:path';
import {afterAll, beforeAll, expect} from 'vitest';
import {nxTargetProject} from '@code-pushup/test-nx-utils';
import {teardownTestFolder} from '@code-pushup/test-setup';
import {E2E_ENVIRONMENTS_DIR, removeColorCodes, TEST_OUTPUT_DIR,} from '@code-pushup/test-utils';
import {executeProcess, readJsonFile} from '@code-pushup/utils';
import {getCurrentTsVersion} from "@code-pushup/typescript-plugin";

describe('PLUGIN collect report with typescript-plugin NPM package', () => {
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'collect',
  );
  const defaultSetupDir = path.join(testFileDir, 'default-setup');

  const fixturesDir = path.join('e2e', nxTargetProject(), 'mocks/fixtures');

  beforeAll(async () => {
    await cp(fixturesDir, testFileDir, {recursive: true});
  });

  afterAll(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should have current TS version defaults generated after install', async () => {
    await expect(readJsonFile(
      path.join(testFileDir, 'node_modules', '.code-pushup', 'plugin-typescript', 'default-ts-configs', await getCurrentTsVersion()),
    )).resolves.not.toThrow();
  });


  it('should run plugin over CLI and creates report.json', async () => {
    const {code, stdout} = await executeProcess({
      command: 'npx',
      // verbose exposes audits with perfect scores that are hidden in the default stdout
      args: ['@code-pushup/cli', 'collect', '--no-progress', '--verbose'],
      cwd: defaultSetupDir,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('● NoImplicitAny');

  });
});
