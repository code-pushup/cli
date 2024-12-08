import { jsonHash, ruleIdToSlug } from './hash.js';

describe('ruleIdToSlug', () => {
  it('should leave core rule unchanged', () => {
    expect(ruleIdToSlug('no-const-reassign', [])).toBe('no-const-reassign');
  });

  it('should replace "/" with "-" in plugin rule', () => {
    expect(ruleIdToSlug('react/jsx-key', [])).toBe('react-jsx-key');
  });

  it('should remove "@" in plugin rule', () => {
    expect(ruleIdToSlug('@nx/dependency-checks', [])).toBe(
      'nx-dependency-checks',
    );
  });

  it('should include hash when rule has custom options', () => {
    expect(
      ruleIdToSlug('@nx/enforce-module-boundaries', [
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ]),
    ).toBe('nx-enforce-module-boundaries-9dba9763586d15c6');
  });

  it('should create different slugs for same rule with different options', () => {
    expect(ruleIdToSlug('max-lines', [200])).not.toEqual(
      ruleIdToSlug('max-lines', [500]),
    );
  });
});

describe('jsonHash', () => {
  it.each([
    undefined,
    [],
    ['as-needed'],
    [400],
    [
      {
        max: 400,
        skipBlankLines: true,
        skipComments: true,
      },
    ],
    ['rxjs/Rx', 'rxjs/internal/operators'],
  ])('should produce short hexadecimal hash for rule options: %j', options => {
    const hash = jsonHash(options);
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[\da-f]+$/);
  });
});
