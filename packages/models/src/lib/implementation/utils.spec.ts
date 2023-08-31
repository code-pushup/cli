import { describe, expect, it } from 'vitest';

import { slugRegex } from './utils';

describe('slugRegex', () => {
  // test valid and array of strings against slugRegex with it blocks
  const slugs = [
    'hello',
    'hello-world',
    'hello-world-again',
    'hello-123',
    'hello-123-world',
    'hello-world-123',
    'hello-123-world-456',
    '123',
    '123-456',
    '123-456-789',
  ];
  for (let i = 0; i < slugs.length; i++) {
    it(`should match valid slugs ${slugs[i]}`, () => {
      const slug = slugs[i];
      expect(slugRegex.test(slug)).toBe(true);
    });
  }

  // test invalid and array of strings against slugRegex with it blocks
  const invalidSlugs = [
    'hello world',
    'hello_world',
    'hello-world-',
    '-hello-world',
    'hello--world',
    'hello-world-again-',
    '-hello-world-again',
    'hello--world--again',
    'hello-world-123-',
    '-hello-world-123',
    'hello--world-123',
    'hello-world-123-456-',
    '-hello-world-123-456',
    'hello--world-123-456',
    '123-',
    '-123',
    '123--456',
    '123-456-',
    '-123-456',
    '123--456-789',
    '123-456-789-',
  ];

  for (let i = 0; i < invalidSlugs.length; i++) {
    it(`should not match valid slugs ${slugs[i]}`, () => {
      const slug = invalidSlugs[i];
      expect(slugRegex.test(slug)).toBe(false);
    });
  }
});
