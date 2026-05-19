import { yargsCli } from './cli-args.js';
import type { PluginSetupBinding } from './types.js';

const bareBindings: PluginSetupBinding[] = [
  {
    slug: 'eslint',
    title: 'ESLint',
    packageName: '@code-pushup/eslint-plugin',
    generateConfig: () => ({ imports: [], pluginInit: [] }),
  },
];

describe('yargsCli', () => {
  it('should expose --eslint.patterns as a flat key', async () => {
    const argv = await yargsCli(bareBindings).parse([
      '--eslint.patterns',
      'src',
    ]);

    expect(argv['eslint.patterns']).toBe('src');
  });

  it('should expose --no-eslint.categories as a flat false', async () => {
    const argv = await yargsCli(bareBindings).parse(['--no-eslint.categories']);

    expect(argv['eslint.categories']).toBeFalse();
  });

  it('should expose --eslint.categories without a value as a flat true', async () => {
    const argv = await yargsCli(bareBindings).parse(['--eslint.categories']);

    expect(argv['eslint.categories']).toBeTrue();
  });
});
