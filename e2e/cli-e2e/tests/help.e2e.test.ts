import { executeProcess } from '@code-pushup/utils';

describe('CLI help', () => {
  it('should print help with argument ---help', async () => {
    const { code, stdout, stderr } = await executeProcess({
      command: 'npx',
      args: [
        '--yes',
        '--quiet',
        '-p',
        '@code-pushup/cli@e2e',
        'code-pushup',
        '--help',
      ],
    });
    expect(code).toBe(0);
    expect(stderr).toBe('');
    expect(stdout).toMatchSnapshot();
  }, 120000);

  // @TODO 'should print help with help command'
});
