import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';
import {join} from "node:path";

describe('CLI help', () => {
  const envRoot = join('static-environments', 'cli-e2e-env');

  it('should print help with help command', async () => {
    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'help'],
      cwd: envRoot,
    });
    expect(code).toBe(0);
    expect(stderr).toBe('');
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
