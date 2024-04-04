import { expect } from 'vitest';
import { auditSchema, groupSchema } from '@code-pushup/models';
import { LIGHTHOUSE_GROUPS, LIGHTHOUSE_NAVIGATION_AUDITS } from './constants';

describe('constants', () => {
  it.each(LIGHTHOUSE_NAVIGATION_AUDITS.map(a => [a.slug, a]))(
    'should parse audit "%s" correctly',
    (slug, audit) => {
      expect(() => auditSchema.parse(audit)).not.toThrow();
      expect(audit.slug).toEqual(slug);
    },
  );

  it('should only include audits supporting the "navigation" mode', () => {
    const invalidAuditSlugs = new Set([
      'interaction-to-next-paint',
      'uses-responsive-images-snapshot',
      'work-during-interaction',
    ]);
    expect(
      LIGHTHOUSE_NAVIGATION_AUDITS.some(({ slug }) =>
        invalidAuditSlugs.has(slug),
      ),
    ).toBe(false);
  });

  it.each(LIGHTHOUSE_GROUPS.map(g => [g.slug, g]))(
    'should parse group "%s" correctly',
    (slug, group) => {
      expect(() => groupSchema.parse(group)).not.toThrow();
      expect(group.slug).toEqual(slug);
    },
  );
});
