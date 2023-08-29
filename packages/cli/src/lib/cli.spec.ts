import { execSync } from 'child_process';
import { cli } from './cli';

describe('cli', () => {
  beforeAll(() => {
    // symlink NPM workspaces
    execSync('npm install');
  });

  it('.js', async () => {
    await expect(cli('./packages/cli/src/lib/config.mock.js')).resolves.toEqual(
      {
        plugins: [
          { name: 'eslint', version: '8.46.0' },
          { name: 'lighthouse', defaultConfig: expect.any(Object) },
        ],
      },
    );
  });

  it('.mjs', async () => {
    await expect(
      cli('./packages/cli/src/lib/config.mock.mjs'),
    ).resolves.toEqual({
      plugins: [
        { name: 'eslint', version: '8.46.0' },
        { name: 'lighthouse', defaultConfig: expect.any(Object) },
      ],
    });
  });

  it('.ts', async () => {
    await expect(cli('./packages/cli/src/lib/config.mock.ts')).resolves.toEqual(
      {
        plugins: [
          { name: 'eslint', version: '8.46.0' },
          { name: 'lighthouse', defaultConfig: expect.any(Object) },
        ],
      },
    );
  });
});
