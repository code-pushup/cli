import { cp } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { E2E_ENVIRONMENTS_DIR, TEST_OUTPUT_DIR } from '@code-pushup/test-utils';
import { executeProcess, readTextFile } from '@code-pushup/utils';

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
    const { code, stderr } = await executeProcess({
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
    expect(stderr).toBe('');

    const md = await readTextFile(path.join(dummyOutputDir, 'report.md'));

    expect(md).toContain('# Code PushUp Report');
    expect(md).toContain(dummyPluginTitle);
    expect(md).toContain(dummyAuditTitle);
  });

  it('should print report summary to stdout', async () => {
    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', '--no-progress', 'collect'],
      cwd: dummyDir,
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    expect(stdout).toContain('Code PushUp Report');
    expect(stdout).not.toContain('Generated reports');
    expect(stdout).toContain(dummyPluginTitle);
    expect(stdout).toContain(dummyAuditTitle);
  });
});
