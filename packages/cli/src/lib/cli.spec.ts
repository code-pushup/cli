import { cli } from './cli';

describe('cli', () => {
  it('CommonJS', async () => {
    await expect(
      cli('./packages/cli/src/lib/config.mock.cjs')
    ).resolves.toEqual({
      plugins: [{ name: 'eslint', version: '8.46.0' }],
    });
  });

  it('ESM', async () => {
    await expect(
      cli('./packages/cli/src/lib/config.mock.mjs')
    ).resolves.toEqual({
      plugins: [
        { name: 'eslint', version: '8.46.0' },
        { name: 'lighthouse', defaultConfig: expect.any(Object) },
      ],
    });
  });

  it('TypeScript', async () => {
    await expect(cli('./packages/cli/src/lib/config.mock.ts')).resolves.toEqual(
      {
        plugins: [
          { name: 'eslint', version: '8.46.0' },
          { name: 'lighthouse', defaultConfig: expect.any(Object) },
        ],
      }
    );
  });
});
