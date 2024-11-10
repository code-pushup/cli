import { join } from 'node:path';
import { afterEach } from 'vitest';
import { cleanTestFolder, teardownTestFolder } from '@code-pushup/test-setup';
import { executeProcess, readTextFile } from '@code-pushup/utils';

describe('CLI collect', () => {
  const dummyPluginTitle = 'Dummy Plugin';
  const dummyAuditTitle = 'Dummy Audit';
  const envRoot = 'static-environments/eslint-e2e-env';
  const baseDir = join(envRoot, '__tests__');

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  beforeEach(async () => {
    await cleanTestFolder(baseDir);
  });

  it('should create report.md', async () => {
    const { code, stderr } = await executeProcess({
      command: 'code-pushup',
      args: ['collect', '--persist.format=md', '--no-progress'],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    const md = await readTextFile(
      'examples/react-todos-app/.code-pushup/report.md',
    );

    expect(md).toContain('# Code PushUp Report');
    expect(md).toContain(dummyPluginTitle);
    expect(md).toContain(dummyAuditTitle);
  });

  it('should print report summary to stdout', async () => {
    const { code, stdout, stderr } = await executeProcess({
      command: 'code-pushup',
      args: ['collect', '--no-progress'],
      cwd: 'examples/react-todos-app',
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    expect(stdout).toContain('Code PushUp Report');
    expect(stdout).not.toContain('Generated reports');
    expect(stdout).toContain(dummyPluginTitle);
    expect(stdout).toContain(dummyAuditTitle);
  });
});
