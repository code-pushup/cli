import { eslintPlugin } from './eslint-plugin';

describe('eslintPlugin', () => {
  it('should initialize ESLint plugin', () => {
    expect(eslintPlugin({ config: '.eslintrc.json' }).slug).toBe('eslint');
  });
});
