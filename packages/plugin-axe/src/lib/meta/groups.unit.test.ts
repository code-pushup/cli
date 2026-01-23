import { describe, expect, it } from 'vitest';
import type { Group } from '@code-pushup/models';
import { loadAxeRules, transformRulesToGroups } from './transform.js';

describe('transformRulesToGroups', () => {
  it('should create category groups for "wcag21aa" preset', async () => {
    const rules = await loadAxeRules('wcag21aa');
    const groups = transformRulesToGroups(rules);

    expect(groups.length).toBeGreaterThan(5);
    expect(groups).toPartiallyContain({ slug: 'aria', title: 'ARIA' });
    expect(groups).toPartiallyContain({ slug: 'forms', title: 'Forms' });
  });

  it('should create category groups for "wcag22aa" preset', async () => {
    const rules = await loadAxeRules('wcag22aa');
    const groups = transformRulesToGroups(rules);

    expect(groups.length).toBeGreaterThan(5);
    expect(groups).toPartiallyContain({ slug: 'aria', title: 'ARIA' });
    expect(groups).toPartiallyContain({ slug: 'forms', title: 'Forms' });
  });

  it('should create category groups for "best-practice" preset', async () => {
    const rules = await loadAxeRules('best-practice');
    const groups = transformRulesToGroups(rules);

    expect(groups.length).toBeGreaterThan(5);
    expect(groups).toPartiallyContain({ slug: 'aria', title: 'ARIA' });
    expect(groups).toPartiallyContain({
      slug: 'semantics',
      title: 'Semantics',
    });
  });

  it('should create category groups for "all" preset', async () => {
    const rules = await loadAxeRules('all');
    const groups = transformRulesToGroups(rules);

    expect(groups.length).toBeGreaterThan(10);
    expect(groups).toPartiallyContain({ slug: 'aria', title: 'ARIA' });
    expect(groups).toPartiallyContain({
      slug: 'color',
      title: 'Color & Contrast',
    });
  });

  it('should format category titles using display names', async () => {
    const rules = await loadAxeRules('all');
    const groups = transformRulesToGroups(rules);

    expect(groups).toPartiallyContain({ slug: 'aria', title: 'ARIA' });
    expect(groups).toPartiallyContain({
      slug: 'name-role-value',
      title: 'Names & Labels',
    });
    expect(groups).toPartiallyContain({
      slug: 'sensory-and-visual-cues',
      title: 'Visual Cues',
    });
  });

  it('should not include "cat." prefix in group slugs', async () => {
    const rules = await loadAxeRules('all');
    const groups = transformRulesToGroups(rules);

    expect(groups).toSatisfyAll<Group>(({ slug }) => !slug.startsWith('cat.'));
  });

  it('should assign equal weight to all audit references within groups', async () => {
    const rules = await loadAxeRules('wcag21aa');
    const groups = transformRulesToGroups(rules);

    expect(groups).toSatisfyAll<Group>(({ refs }) =>
      refs.every(({ weight }) => weight === 1),
    );
  });

  it('should filter out empty groups', async () => {
    const rules = await loadAxeRules('all');
    const groups = transformRulesToGroups(rules);

    expect(groups).toSatisfyAll<Group>(({ refs }) => refs.length > 0);
  });
});
