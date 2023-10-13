import { executeProcess } from '@code-pushup/utils';

describe('CLI help', () => {
  it('should print help', async () => {
    const { stdout } = await executeProcess({
      command: 'npx',
      args: ['./dist/packages/cli', '--help'],
    });
    expect(stdout).toMatchSnapshot();
  });
});
