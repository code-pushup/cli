import { auditSchema, groupSchema } from '@code-pushup/models';
import {
  LIGHTHOUSE_GROUPS,
  LIGHTHOUSE_NAVIGATION_AUDITS,
} from './constants.js';

describe('constants', () => {
  it.each(LIGHTHOUSE_NAVIGATION_AUDITS.map(a => [a.slug, a]))(
    'should parse audit "%s" correctly',
    (slug, audit) => {
      expect(() => auditSchema.parse(audit)).not.toThrow();
      expect(audit.slug).toEqual(slug);
    },
  );

  it.each([
    'interaction-to-next-paint',
    'uses-responsive-images-snapshot',
    'work-during-interaction',
  ])(
    'should not include audit %s which does not support the "navigation" mode',
    invalidSlug => {
      expect(
        LIGHTHOUSE_NAVIGATION_AUDITS.every(({ slug }) => slug !== invalidSlug),
      ).toBeTrue();
    },
  );

  it.each(LIGHTHOUSE_GROUPS.map(g => [g.slug, g]))(
    'should parse group "%s" correctly',
    (slug, group) => {
      expect(() => groupSchema.parse(group)).not.toThrow();
      expect(group.slug).toEqual(slug);
    },
  );
});
