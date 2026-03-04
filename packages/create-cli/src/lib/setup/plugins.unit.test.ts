import { parsePluginSlugs, validatePluginSlugs } from './plugins.js';

describe('parsePluginSlugs', () => {
  it.each([
    ['eslint,coverage', ['eslint', 'coverage']],
    [' eslint , coverage ', ['eslint', 'coverage']],
    ['eslint,eslint', ['eslint']],
    ['eslint,,coverage', ['eslint', 'coverage']],
  ])('should parse %j into %j', (input, expected) => {
    expect(parsePluginSlugs(input)).toStrictEqual(expected);
  });
});

describe('validatePluginSlugs', () => {
  const bindings = [
    {
      slug: 'eslint',
      title: 'ESLint',
      packageName: '@code-pushup/eslint-plugin',
      generateConfig: () => ({ imports: [], pluginInit: '' }),
    },
    {
      slug: 'coverage',
      title: 'Code Coverage',
      packageName: '@code-pushup/coverage-plugin',
      generateConfig: () => ({ imports: [], pluginInit: '' }),
    },
  ];

  it('should not throw for valid or missing slugs', () => {
    expect(() => validatePluginSlugs(bindings)).not.toThrow();
    expect(() =>
      validatePluginSlugs(bindings, ['eslint', 'coverage']),
    ).not.toThrow();
  });

  it('should throw TypeError on unknown slug', () => {
    expect(() => validatePluginSlugs(bindings, ['eslint', 'unknown'])).toThrow(
      TypeError,
    );
    expect(() => validatePluginSlugs(bindings, ['eslint', 'unknown'])).toThrow(
      'Unknown plugin slugs: unknown',
    );
  });
});
