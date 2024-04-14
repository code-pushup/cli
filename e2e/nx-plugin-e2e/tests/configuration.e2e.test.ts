import { expect } from 'vitest';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';

describe('nx-plugin g configuration', () => {
  it('should run configuration generator on react-todos-app', async () => {
    const { code, stderr, stdout } = await executeProcess({
      command: 'nx',
      args: [
        'g',
        '@code-pushup/nx-plugin:configuration react-todos-app --dryRun',
      ],
    });

    const cleadStderr = removeColorCodes(stderr);
    expect(code).toBe(0);

    expect(cleadStderr).toContain(
      `NOTE: No config file created as code-pushup.config.js file already exists.`,
    );
    expect(cleadStderr).toContain(
      'NOTE: The "dryRun" flag means no changes were made.',
    );

    const cleadStdout = removeColorCodes(stdout);
    expect(cleadStdout).toContain(
      `NX  Generating @code-pushup/nx-plugin:configuration`,
    );
    /*
     expect(cleadStdout).toContain(`CREATE examples/react-todos-app/code-pushup.config.ts`);
     expect(cleadStdout).toContain(`UPDATE examples/react-todos-app/project.json`);
     */
  });
});
