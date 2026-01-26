import axe from 'axe-core';
import { axeCategoryGroupSlugSchema, axeWcagTagSchema } from './groups.js';

describe('axeCategoryGroupSlugSchema', () => {
  const axeCategoryTags = axe
    .getRules()
    .flatMap(rule => rule.tags)
    .filter(tag => tag.startsWith('cat.'));

  const ourCategoryTags = axeCategoryGroupSlugSchema.options.map(
    slug => `cat.${slug}`,
  );

  it('should not have categories removed by axe-core', () => {
    expect(axeCategoryTags).toIncludeAllMembers(ourCategoryTags);
  });

  it('should not be missing categories added by axe-core', () => {
    expect(ourCategoryTags).toIncludeAllMembers(axeCategoryTags);
  });
});

describe('axeWcagTagSchema', () => {
  const axeTags = axe.getRules().flatMap(rule => rule.tags);

  it('should not have WCAG tags removed by axe-core', () => {
    expect(axeTags).toIncludeAllMembers(axeWcagTagSchema.options);
  });
});
