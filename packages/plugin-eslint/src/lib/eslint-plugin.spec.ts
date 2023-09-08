import { eslintPlugin } from './eslint-plugin';

describe('eslintPlugin', () => {
  it('should initialize ESLint plugin', () => {
    expect(eslintPlugin({ config: '.eslintrc.json' }).meta.slug).toBe('eslint');
  });
});
