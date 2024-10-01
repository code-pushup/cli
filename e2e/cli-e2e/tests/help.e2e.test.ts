import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';

describe('CLI help', () => {
  it('should print help with help command', async () => {
    const { code, stdout, stderr } = await executeProcess({
      command: 'code-pushup',
      args: ['help'],
    });
    expect(code).toBe(0);
    expect(stderr).toBe('');
    expect(removeColorCodes(stdout)).toMatchSnapshot();
  });

  it('should produce the same output to stdout for both help argument and help command', async () => {
    const helpArgResult = await executeProcess({
      command: 'code-pushup',
      args: ['help'],
    });
    const helpCommandResult = await executeProcess({
      command: 'code-pushup',
      args: ['--help'],
    });
    expect(helpArgResult.code).toBe(0);
    expect(helpCommandResult.code).toBe(0);
    expect(helpArgResult.stdout).toBe(helpCommandResult.stdout);
  });
});
