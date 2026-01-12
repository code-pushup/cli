import path from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  type TestEnvironment,
  setupTestEnvironment,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import {
  executeProcess,
  fileExists,
  readJsonFile,
  readTextFile,
} from '@code-pushup/utils';
import { dummyPluginSlug } from '../mocks/fixtures/dummy-setup/dummy.plugin';

describe('CLI collect', () => {
  const dummyPluginTitle = 'Dummy Plugin';
  const dummyAuditTitle = 'Dummy Audit';

  let testEnv: TestEnvironment;
  let dummyDir: string;
  let dummyOutputDir: string;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment(
      ['..', 'mocks', 'fixtures', 'dummy-setup'],
      {
        callerUrl: import.meta.url,
      },
    );
    dummyDir = testEnv.baseDir;
    dummyOutputDir = path.join(dummyDir, '.code-pushup');
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  afterEach(async () => {
    await teardownTestFolder(dummyOutputDir);
  });

  it('should create report.md', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--persist.format=md'],
      cwd: dummyDir,
    });

    expect(code).toBe(0);

    const md = await readTextFile(path.join(dummyOutputDir, 'report.md'));

    expect(md).toContain('# Code PushUp report');
    expect(md).toContain(dummyPluginTitle);
    expect(md).toContain(dummyAuditTitle);
  });

  it('should write runner outputs if --cache is given', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--cache'],
      cwd: dummyDir,
    });

    expect(code).toBe(0);

    await expect(
      readJsonFile(
        path.join(dummyOutputDir, dummyPluginSlug, 'runner-output.json'),
      ),
    ).resolves.toStrictEqual([
      {
        slug: 'dummy-audit',
        score: 0.3,
        value: 3,
      },
    ]);
  });

  it('should not create reports if --persist.skipReports is given', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--persist.skipReports'],
      cwd: dummyDir,
    });

    expect(code).toBe(0);

    await expect(
      fileExists(path.join(dummyOutputDir, 'report.md')),
    ).resolves.toBeFalsy();
    await expect(
      fileExists(path.join(dummyOutputDir, 'report.json')),
    ).resolves.toBeFalsy();
  });

  it('should print report summary to stdout', async () => {
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect'],
      cwd: dummyDir,
    });

    expect(code).toBe(0);

    expect(stdout).toContain('Code PushUp report');
    expect(stdout).not.toContain('Generated reports');
    expect(stdout).toContain(dummyPluginTitle);
    expect(stdout).toContain(dummyAuditTitle);
  });
});
