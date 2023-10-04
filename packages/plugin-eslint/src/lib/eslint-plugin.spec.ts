import { eslintPlugin } from './eslint-plugin';

describe('eslintPlugin', () => {
  it('should initialize ESLint plugin', async () => {
    const plugin = await eslintPlugin({
      eslintrc: '.eslintrc.json',
      patterns: ['**/*.ts', '**/*.js', '**/*.json'],
    });
    console.log(plugin);
    expect(plugin.slug).toBe('eslint');
  });
});
