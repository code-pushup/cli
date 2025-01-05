import path from 'node:path';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  removeColorCodes,
} from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';

describe('CLI help', () => {
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());

  it('should print help with help command', async () => {
    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'help'],
      cwd: envRoot,
    });
    expect(code).toBe(0);
    expect(removeColorCodes(stdout)).toMatchSnapshot();
  });

  it('should produce the same output to stdout for both help argument and help command', async () => {
    const helpArgResult = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'help'],
    });
    const helpCommandResult = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', '--help'],
      cwd: envRoot,
    });
    expect(helpArgResult.code).toBe(0);
    expect(helpCommandResult.code).toBe(0);
    expect(helpArgResult.stdout).toBe(helpCommandResult.stdout);
  });
});
