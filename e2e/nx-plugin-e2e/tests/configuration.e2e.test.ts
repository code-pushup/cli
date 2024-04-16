import { expect } from 'vitest';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';

describe('nx-plugin g configuration', () => {
  it('should run configuration generator on react-todos-app', async () => {
    const { code, stderr, stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'g',
        '@code-pushup/nx-plugin:configuration react-todos-app --dryRun',
      ],
    });

    const cleanedStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleanedStderr).toContain(
      `NOTE: No config file created as code-pushup.config.js file already exists.`,
    );
    expect(cleanedStderr).toContain(
      'NOTE: The "dryRun" flag means no changes were made.',
    );

    const cleanedStdout = removeColorCodes(stdout);
    expect(cleanedStdout).toContain(
      `NX  Generating @code-pushup/nx-plugin:configuration`,
    );
    /*
     expect(cleanedStdout).toContain(`CREATE examples/react-todos-app/code-pushup.config.ts`);
     expect(cleanedStdout).toContain(`UPDATE examples/react-todos-app/project.json`);
     */
  });
});
