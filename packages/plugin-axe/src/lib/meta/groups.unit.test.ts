import type { RuleMetadata } from 'axe-core';
import { describe, expect, it } from 'vitest';
import { loadAxeRules, transformRulesToGroups } from './transform.js';

describe('transformRulesToGroups', () => {
  describe('wcag21aa preset', () => {
    it('should create WCAG 2.1 Level A and AA groups', () => {
      const groups = transformRulesToGroups(
        loadAxeRules('wcag21aa'),
        'wcag21aa',
      );

      expect(groups.map(({ slug }) => slug)).toEqual([
        'wcag21-level-a',
        'wcag21-level-aa',
      ]);
      expect(groups.map(({ title }) => title)).toEqual([
        'WCAG 2.1 Level A',
        'WCAG 2.1 Level AA',
      ]);
    });

    it('should have refs in WCAG groups', () => {
      transformRulesToGroups(loadAxeRules('wcag21aa'), 'wcag21aa').forEach(
        ({ refs }) => {
          expect(refs.length).toBeGreaterThan(0);
        },
      );
    });
  });

  describe('wcag22aa preset', () => {
    it('should create WCAG 2.2 Level A and AA groups', () => {
      const groups = transformRulesToGroups(
        loadAxeRules('wcag22aa'),
        'wcag22aa',
      );

      expect(groups.map(({ slug }) => slug)).toEqual([
        'wcag22-level-a',
        'wcag22-level-aa',
      ]);
      expect(groups.map(({ title }) => title)).toEqual([
        'WCAG 2.2 Level A',
        'WCAG 2.2 Level AA',
      ]);
    });
  });

  describe('best-practice preset', () => {
    it('should create multiple category groups', () => {
      expect(
        transformRulesToGroups(loadAxeRules('best-practice'), 'best-practice')
          .length,
      ).toBeGreaterThan(5);
    });

    it('should format category titles correctly', () => {
      const groups = transformRulesToGroups(
        loadAxeRules('best-practice'),
        'best-practice',
      );

      expect(groups.find(({ slug }) => slug === 'aria')?.title).toBe('ARIA');
      expect(groups.find(({ slug }) => slug === 'name-role-value')?.title).toBe(
        'Names & Labels',
      );
    });

    it('should format unknown category titles with title case', () => {
      const groups = transformRulesToGroups(
        [{ tags: ['cat.some-new-category', 'best-practice'] } as RuleMetadata],
        'best-practice',
      );

      expect(
        groups.find(({ slug }) => slug === 'some-new-category')?.title,
      ).toBe('Some New Category');
    });

    it('should remove "cat." prefix from category slugs', () => {
      transformRulesToGroups(
        loadAxeRules('best-practice'),
        'best-practice',
      ).forEach(({ slug }) => {
        expect(slug).not.toMatch(/^cat\./);
      });
    });
  });

  describe('all preset', () => {
    it('should combine WCAG and category groups', () => {
      const groups = transformRulesToGroups(loadAxeRules('all'), 'all');

      expect(groups.filter(({ slug }) => slug.startsWith('wcag'))).toHaveLength(
        2,
      );
      expect(
        groups.filter(({ slug }) => !slug.startsWith('wcag')).length,
      ).toBeGreaterThan(5);
    });

    it('should use WCAG 2.2 for all preset', () => {
      const groups = transformRulesToGroups(loadAxeRules('all'), 'all');

      expect(groups.some(({ slug }) => slug === 'wcag22-level-a')).toBe(true);
      expect(groups.some(({ slug }) => slug === 'wcag22-level-aa')).toBe(true);
    });
  });

  describe('group structure', () => {
    it('should have all refs with weight 1', () => {
      transformRulesToGroups(loadAxeRules('wcag21aa'), 'wcag21aa').forEach(
        ({ refs }) => {
          refs.forEach(({ weight }) => {
            expect(weight).toBe(1);
          });
        },
      );
    });

    it('should filter out empty groups', () => {
      transformRulesToGroups(loadAxeRules('all'), 'all').forEach(({ refs }) => {
        expect(refs.length).toBeGreaterThan(0);
      });
    });
  });
});
