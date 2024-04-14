import { expect } from 'vitest';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';

describe('nx-plugin g init', () => {
  it('should run init generator and execute correctly', async () => {
    const { code, stderr, stdout } = await executeProcess({
      command: 'nx',
      args: ['g', '@code-pushup/nx-plugin:init --dryRun'],
      observer: { onStdout: console.info },
    });

    const cleadStderr = removeColorCodes(stderr);
    expect(cleadStderr).toContain(
      'NOTE: The "dryRun" flag means no changes were made.',
    );
    expect(code).toBe(0);
    const cleadStdout = removeColorCodes(stdout);
    expect(cleadStdout).toContain(`NX  Generating @code-pushup/nx-plugin:init`);
    expect(cleadStdout).toContain(`UPDATE package.json`);
    expect(cleadStdout).toContain(`UPDATE nx.json`);
  });
});
