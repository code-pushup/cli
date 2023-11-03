import { executeProcess } from '@code-pushup/utils';

describe('CLI help', () => {
  it('should print help with argument ---help', async () => {
    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: ['./dist/packages/cli', '--help'],
    });
    expect(code).toBe(0);
    expect(stderr).toBe('');
    expect(stdout).toMatchSnapshot();
  });

  it('should print help with help command', async () => {
    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: ['./dist/packages/cli', 'help'],
    });
    expect(code).toBe(0);
    expect(stderr).toBe('');
    expect(stdout).toMatchSnapshot();
  });
});
