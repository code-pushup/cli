import { expect } from 'vitest';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';

describe('nx-plugin g init', () => {
  it('should run init generator and execute correctly', async () => {
    const { code, stderr, stdout } = await executeProcess({
      command: 'npx',
      args: ['nx', 'g', '@code-pushup/nx-plugin:init --dryRun'],
      observer: { onStdout: console.info },
    });

    const cleanedStderr = removeColorCodes(stderr);
    expect(cleanedStderr).toContain(
      'NOTE: The "dryRun" flag means no changes were made.',
    );
    expect(code).toBe(0);
    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating @code-pushup/nx-plugin:init`,
    );
    expect(cleanedStdout).toContain(`UPDATE package.json`);
    expect(cleanedStdout).toContain(`UPDATE nx.json`);
  });
});
