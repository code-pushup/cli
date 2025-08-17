import { describe, expect, it } from 'vitest';
import {
  type Audit,
  type Group,
  type PluginConfig,
  categoryRefSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import {
  AuditsNotImplementedError,
  CategoriesNotImplementedError,
  lighthouseAuditRef,
  lighthouseGroupRef,
  markSkippedAuditsAndGroups,
  validateAudits,
  validateOnlyCategories,
} from './utils.js';

describe('lighthouseAuditRef', () => {
  it('should return valid lighthouse group with weight 1 by default', () => {
    const auditRef = categoryRefSchema.parse(lighthouseAuditRef('is-on-https'));
    expect(auditRef.slug).toBe('is-on-https');
    expect(auditRef.weight).toBe(1);
  });

  it('should return valid lighthouse group with provided weight', () => {
    const auditRef = categoryRefSchema.parse(
      lighthouseAuditRef('is-on-https', 0),
    );
    expect(auditRef.weight).toBe(0);
  });
});

describe('lighthouseGroupRef', () => {
  it('should return valid lighthouse group with weight 1 by default', () => {
    const groupRef = categoryRefSchema.parse(lighthouseGroupRef('performance'));
    expect(groupRef.slug).toBe('performance');
    expect(groupRef.weight).toBe(1);
  });

  it('should return valid lighthouse group with provided weight', () => {
    const groupRef = categoryRefSchema.parse(
      lighthouseGroupRef('performance', 0),
    );
    expect(groupRef.weight).toBe(0);
  });
});

describe('validateAudits', () => {
  it('should not throw for audit slugs existing in given audits', () => {
    expect(
      validateAudits(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
        ],
        ['a'],
      ),
    ).toBeTruthy();
  });

  it('should throw if given audits do not exist', () => {
    expect(() =>
      validateAudits(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
        ],
        ['missing-audit'],
      ),
    ).toThrow(new AuditsNotImplementedError(['missing-audit']));
  });
});

describe('validateOnlyCategories', () => {
  it('should not throw for category slugs existing in given categories', () => {
    expect(
      validateOnlyCategories(
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
          {
            slug: 'coverage',
            title: 'Code coverage',
            refs: [{ slug: 'function-coverage', weight: 1 }],
          },
        ],
        'coverage',
      ),
    ).toBeTruthy();
  });

  it('should throw if given onlyCategories do not exist', () => {
    expect(() =>
      validateOnlyCategories(
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
        ],
        'missing-category',
      ),
    ).toThrow(new CategoriesNotImplementedError(['missing-category']));
  });
});

describe('markSkippedAuditsAndGroups to be used in plugin config', () => {
  type PartialGroup = Partial<
    Omit<Group, 'refs'> & { refs: Partial<Group['refs'][number]>[] }
  >;
  const basePluginConfig = (
    audits: Partial<Audit>[],
    groups: PartialGroup[],
  ): PluginConfig => ({
    slug: 'coverage',
    title: 'Code Coverage',
    icon: 'file',
    description: 'Runs test coverage and created audits',
    runner: {
      command: 'node',
      outputFile: 'out.json',
    },
    audits: audits.map(({ slug: auditSlug, title: auditTitle }) => ({
      slug: auditSlug ?? 'slug',
      title: auditTitle ?? 'title',
    })),
    groups: groups.map(({ slug: groupSlug, title: groupTitle, refs = [] }) => ({
      slug: groupSlug ?? 'slug',
      title: groupTitle ?? 'title',
      refs: refs.map(({ slug: auditRegSlug, weight } = {}) => ({
        slug: auditRegSlug ?? 'slug',
        weight: weight ?? 1,
      })),
    })),
  });

  it('should return given audits and groups if no filter is set', () => {
    const audits = [{ slug: 'speed-index' }] as Audit[];
    const groups = [
      {
        slug: 'performance',
        refs: [{ slug: 'speed-index' }],
      },
    ] as Group[];
    const { audits: markedAudits, groups: markedGroups } =
      markSkippedAuditsAndGroups(audits, groups, {});

    expect(markedAudits).toStrictEqual(audits);
    expect(markedGroups).toStrictEqual(groups);

    const pluginConfig = basePluginConfig(markedAudits, markedGroups);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should mark audits as skipped when skipAudits is set', () => {
    const { audits: markedAudits, groups: markedGroups } =
      markSkippedAuditsAndGroups(
        [
          { slug: 'speed-index' },
          { slug: 'first-contentful-paint' },
        ] as Audit[],
        [
          {
            slug: 'performance',
            refs: [{ slug: 'speed-index' }, { slug: 'first-contentful-paint' }],
          },
        ] as Group[],
        { skipAudits: ['speed-index'] },
      );

    expect(markedAudits).toStrictEqual([
      { slug: 'speed-index', isSkipped: true },
      { slug: 'first-contentful-paint', isSkipped: false },
    ]);
    expect(markedGroups).toStrictEqual([
      {
        slug: 'performance',
        isSkipped: false,
        refs: [{ slug: 'speed-index' }, { slug: 'first-contentful-paint' }],
      },
    ]);

    const pluginConfig = basePluginConfig(markedAudits, markedGroups);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should throw if skipAudits is set with a missing audit slug', () => {
    expect(() =>
      markSkippedAuditsAndGroups(
        [
          { slug: 'speed-index' },
          { slug: 'first-contentful-paint' },
        ] as Audit[],
        [
          {
            slug: 'performance',
            refs: [
              { slug: 'speed-index' },
              { slug: 'largest-contentful-paint' },
            ],
          },
        ] as Group[],
        { skipAudits: ['missing-audit'] },
      ),
    ).toThrow(new AuditsNotImplementedError(['missing-audit']));
  });

  it('should mark audits as not skipped when onlyAudits is set', () => {
    const { audits: markedAudits, groups: markedGroups } =
      markSkippedAuditsAndGroups(
        [
          { slug: 'speed-index' },
          { slug: 'first-contentful-paint' },
        ] as Audit[],
        [
          {
            slug: 'performance',
            refs: [{ slug: 'speed-index' }],
          },
        ] as Group[],
        { onlyAudits: ['speed-index'] },
      );

    expect(markedAudits).toStrictEqual([
      { slug: 'speed-index', isSkipped: false },
      { slug: 'first-contentful-paint', isSkipped: true },
    ]);
    expect(markedGroups).toStrictEqual([
      {
        slug: 'performance',
        isSkipped: false,
        refs: [{ slug: 'speed-index' }],
      },
    ]);
    const pluginConfig = basePluginConfig(markedAudits, markedGroups);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should throw if onlyAudits is set with a missing audit slug', () => {
    expect(() =>
      markSkippedAuditsAndGroups(
        [
          { slug: 'speed-index' },
          { slug: 'first-contentful-paint' },
        ] as Audit[],
        [
          {
            slug: 'performance',
            refs: [{ slug: 'speed-index' }],
          },
        ] as Group[],
        { onlyAudits: ['missing-audit'] },
      ),
    ).toThrow(new AuditsNotImplementedError(['missing-audit']));
  });

  it('should mark skipped audits and groups when onlyGroups is set', () => {
    const { audits: markedAudits, groups: markedGroups } =
      markSkippedAuditsAndGroups(
        [
          { slug: 'speed-index' },
          { slug: 'first-contentful-paint' },
          { slug: 'function-coverage' },
        ] as Audit[],
        [
          {
            slug: 'performance',
            refs: [{ slug: 'speed-index' }],
          },
          {
            slug: 'coverage',
            refs: [{ slug: 'function-coverage' }],
          },
        ] as Group[],
        { onlyCategories: ['coverage'] },
      );

    expect(markedAudits).toStrictEqual([
      { slug: 'speed-index', isSkipped: true },
      { slug: 'first-contentful-paint', isSkipped: true },
      { slug: 'function-coverage', isSkipped: false },
    ]);
    expect(markedGroups).toStrictEqual([
      {
        slug: 'performance',
        isSkipped: true,
        refs: [{ slug: 'speed-index' }],
      },
      {
        slug: 'coverage',
        isSkipped: false,
        refs: [{ slug: 'function-coverage' }],
      },
    ]);

    const pluginConfig = basePluginConfig(markedAudits, markedGroups);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should handle mixed onlyGroups and onlyAudits filters', () => {
    const { audits: markedAudits, groups: markedGroups } =
      markSkippedAuditsAndGroups(
        [
          { slug: 'speed-index' },
          { slug: 'first-contentful-paint' },
          { slug: 'function-coverage' },
        ] as Audit[],
        [
          {
            slug: 'performance',
            refs: [{ slug: 'speed-index' }],
          },
          {
            slug: 'coverage',
            refs: [{ slug: 'function-coverage' }],
          },
        ] as Group[],
        {
          onlyAudits: ['speed-index'],
          onlyCategories: ['coverage'],
        },
      );

    expect(markedAudits).toStrictEqual([
      { slug: 'speed-index', isSkipped: true },
      { slug: 'first-contentful-paint', isSkipped: true },
      { slug: 'function-coverage', isSkipped: true },
    ]);
    expect(markedGroups).toStrictEqual([
      {
        slug: 'performance',
        isSkipped: true,
        refs: [{ slug: 'speed-index' }],
      },
      {
        slug: 'coverage',
        isSkipped: true,
        refs: [{ slug: 'function-coverage' }],
      },
    ]);

    const pluginConfig = basePluginConfig(markedAudits, markedGroups);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should mark a group as skipped if all of its audits are skipped', () => {
    const { audits: markedAudits, groups: markedGroups } =
      markSkippedAuditsAndGroups(
        [
          { slug: 'speed-index' },
          { slug: 'first-contentful-paint' },
        ] as Audit[],
        [
          {
            slug: 'performance',
            refs: [{ slug: 'speed-index' }, { slug: 'first-contentful-paint' }],
          },
        ] as Group[],
        { skipAudits: ['speed-index', 'first-contentful-paint'] },
      );

    expect(markedAudits).toStrictEqual([
      { slug: 'speed-index', isSkipped: true },
      { slug: 'first-contentful-paint', isSkipped: true },
    ]);
    expect(markedGroups).toStrictEqual([
      {
        slug: 'performance',
        isSkipped: true,
        refs: [{ slug: 'speed-index' }, { slug: 'first-contentful-paint' }],
      },
    ]);

    const pluginConfig = basePluginConfig(markedAudits, markedGroups);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should throw if onlyAudits is set with a audit slug that is not implemented', () => {
    expect(() =>
      markSkippedAuditsAndGroups(
        [{ slug: 'speed-index' }] as Audit[],
        [
          {
            slug: 'performance',
            refs: [{ slug: 'speed-index' }],
          },
        ] as Group[],
        {
          onlyAudits: ['missing-audit'],
        },
      ),
    ).toThrow(new AuditsNotImplementedError(['missing-audit']));
  });

  it('should throw if onlyGroups is set with a group slug that is not implemented', () => {
    expect(() =>
      markSkippedAuditsAndGroups(
        [{ slug: 'speed-index' }] as Audit[],
        [
          {
            slug: 'performance',
            refs: [{ slug: 'speed-index' }],
          },
        ] as Group[],
        {
          onlyCategories: ['missing-group'],
        },
      ),
    ).toThrow(new CategoriesNotImplementedError(['missing-group']));
  });
});
