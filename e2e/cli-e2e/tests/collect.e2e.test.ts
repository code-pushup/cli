import { cp } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile, readTextFile } from '@code-pushup/utils';
import { dummyPluginSlug } from '../mocks/fixtures/dummy-setup/dummy.plugin';

describe('CLI collect', () => {
  const dummyPluginTitle = 'Dummy Plugin';
  const dummyAuditTitle = 'Dummy Audit';
  const fixtureDummyDir = path.join(
    'e2e',
    nxTargetProject(),
    'mocks',
    'fixtures',
    'dummy-setup',
  );
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'collect',
  );
  const dummyDir = path.join(testFileDir, 'dummy-setup');
  const dummyOutputDir = path.join(dummyDir, '.code-pushup');

  beforeAll(async () => {
    await cp(fixtureDummyDir, dummyDir, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestFolder(dummyDir);
  });

  afterEach(async () => {
    await teardownTestFolder(dummyOutputDir);
  });

  it('should create report.md', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        '--no-progress',
        'collect',
        '--persist.format=md',
      ],
      cwd: dummyDir,
    });

    expect(code).toBe(0);

    const md = await readTextFile(path.join(dummyOutputDir, 'report.md'));

    expect(md).toContain('# Code PushUp Report');
    expect(md).toContain(dummyPluginTitle);
    expect(md).toContain(dummyAuditTitle);
  });

  it('should write runner outputs if --cache is given', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', '--no-progress', 'collect', '--cache'],
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

  it('should print report summary to stdout', async () => {
    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', '--no-progress', 'collect'],
      cwd: dummyDir,
    });

    expect(code).toBe(0);

    expect(stdout).toContain('Code PushUp Report');
    expect(stdout).not.toContain('Generated reports');
    expect(stdout).toContain(dummyPluginTitle);
    expect(stdout).toContain(dummyAuditTitle);
  });
});
