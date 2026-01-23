import { describe, expect, it } from 'vitest';
import { axeCategoryGroupSlugSchema, axeWcagTagSchema } from './groups.js';
import { importAxeCore } from './safe-axe-import.js';

describe('axeCategoryGroupSlugSchema', () => {
  it('should not have categories removed by axe-core', async () => {
    const axe = await importAxeCore();
    const axeCategoryTags = axe
      .getRules()
      .flatMap(rule => rule.tags)
      .filter(tag => tag.startsWith('cat.'));

    const ourCategoryTags = axeCategoryGroupSlugSchema.options.map(
      slug => `cat.${slug}`,
    );

    expect(axeCategoryTags).toIncludeAllMembers(ourCategoryTags);
  });

  it('should not be missing categories added by axe-core', async () => {
    const axe = await importAxeCore();
    const axeCategoryTags = axe
      .getRules()
      .flatMap(rule => rule.tags)
      .filter(tag => tag.startsWith('cat.'));

    const ourCategoryTags = axeCategoryGroupSlugSchema.options.map(
      slug => `cat.${slug}`,
    );

    expect(ourCategoryTags).toIncludeAllMembers(axeCategoryTags);
  });
});

describe('axeWcagTagSchema', () => {
  it('should not have WCAG tags removed by axe-core', async () => {
    const axe = await importAxeCore();
    const axeTags = axe.getRules().flatMap(rule => rule.tags);

    expect(axeTags).toIncludeAllMembers(axeWcagTagSchema.options);
  });
});
