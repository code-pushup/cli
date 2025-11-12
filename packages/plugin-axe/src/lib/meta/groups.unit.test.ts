import type { RuleMetadata } from 'axe-core';
import { describe, expect, it } from 'vitest';
import type { Group } from '@code-pushup/models';
import { loadAxeRules, transformRulesToGroups } from './transform.js';

describe('transformRulesToGroups', () => {
  it('should create WCAG 2.1 Level A and AA groups for "wcag21aa" preset', () => {
    const groups = transformRulesToGroups(loadAxeRules('wcag21aa'), 'wcag21aa');

    expect(groups).toBeArrayOfSize(2);
    expect(groups).toPartiallyContain({
      slug: 'wcag21-level-a',
      title: 'WCAG 2.1 Level A',
    });
    expect(groups).toPartiallyContain({
      slug: 'wcag21-level-aa',
      title: 'WCAG 2.1 Level AA',
    });
  });

  it('should populate group refs with audit references for "wcag21aa" preset', () => {
    const groups = transformRulesToGroups(loadAxeRules('wcag21aa'), 'wcag21aa');

    expect(groups[0]!.refs).not.toBeEmpty();
    expect(groups[1]!.refs).not.toBeEmpty();
  });

  it('should create WCAG 2.2 Level A and AA groups for "wcag22aa" preset', () => {
    const groups = transformRulesToGroups(loadAxeRules('wcag22aa'), 'wcag22aa');

    expect(groups).toBeArrayOfSize(2);
    expect(groups).toPartiallyContain({
      slug: 'wcag22-level-a',
      title: 'WCAG 2.2 Level A',
    });
    expect(groups).toPartiallyContain({
      slug: 'wcag22-level-aa',
      title: 'WCAG 2.2 Level AA',
    });
  });

  it('should create multiple category groups for "best-practice" preset', () => {
    expect(
      transformRulesToGroups(loadAxeRules('best-practice'), 'best-practice')
        .length,
    ).toBeGreaterThan(5);
  });

  it('should format category titles using display names', () => {
    const groups = transformRulesToGroups(
      loadAxeRules('best-practice'),
      'best-practice',
    );

    expect(groups).toPartiallyContain({ slug: 'aria', title: 'ARIA' });
    expect(groups).toPartiallyContain({
      slug: 'name-role-value',
      title: 'Names & Labels',
    });
  });

  it('should format unknown category titles with title case', () => {
    const groups = transformRulesToGroups(
      [{ tags: ['cat.some-new-category', 'best-practice'] } as RuleMetadata],
      'best-practice',
    );

    expect(groups).toPartiallyContain({
      slug: 'some-new-category',
      title: 'Some New Category',
    });
  });

  it('should remove "cat." prefix from category slugs', () => {
    const groups = transformRulesToGroups(
      loadAxeRules('best-practice'),
      'best-practice',
    );

    expect(groups).toSatisfyAll<Group>(({ slug }) => !slug.match(/^cat\./));
  });

  it('should include both WCAG 2.2 and category groups for "all" preset', () => {
    const groups = transformRulesToGroups(loadAxeRules('all'), 'all');

    expect(groups).toPartiallyContain({ slug: 'wcag22-level-a' });
    expect(groups).toPartiallyContain({ slug: 'wcag22-level-aa' });

    expect(groups).toSatisfyAny(({ slug }) => !slug.startsWith('wcag'));
  });

  it('should assign equal weight to all audit references within groups', () => {
    const groups = transformRulesToGroups(loadAxeRules('wcag21aa'), 'wcag21aa');

    expect(groups).toSatisfyAll<Group>(({ refs }) =>
      refs.every(({ weight }) => weight === 1),
    );
  });

  it('should filter out empty groups', () => {
    const groups = transformRulesToGroups(loadAxeRules('all'), 'all');

    expect(groups).toSatisfyAll<Group>(({ refs }) => refs.length > 0);
  });
});
