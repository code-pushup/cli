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
  filterAuditsAndGroupsByOnlyOptions,
  lighthouseAuditRef,
  lighthouseGroupRef,
  validateAudits,
  validateOnlyCategories,
} from './utils';

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

describe('filterAuditsAndGroupsByOnlyOptions to be used in plugin config', () => {
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
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(audits, groups, {});

    expect(filteredAudits).toStrictEqual(audits);
    expect(filteredGroups).toStrictEqual(groups);

    const pluginConfig = basePluginConfig(filteredAudits, filteredGroups);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should filter audits if skipAudits is set', () => {
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(
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

    expect(filteredAudits).toStrictEqual([{ slug: 'first-contentful-paint' }]);
    expect(filteredGroups).toStrictEqual([
      {
        slug: 'performance',
        refs: [{ slug: 'first-contentful-paint' }],
      },
    ]);

    const pluginConfig = basePluginConfig(filteredAudits, filteredGroups);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should throw if skipAudits is set with a missing audit slug', () => {
    expect(() =>
      filterAuditsAndGroupsByOnlyOptions(
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

  it('should filter audits if onlyAudits is set', () => {
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(
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

    expect(filteredAudits).toStrictEqual([{ slug: 'speed-index' }]);
    expect(filteredGroups).toStrictEqual([
      {
        slug: 'performance',
        refs: [{ slug: 'speed-index' }],
      },
    ]);
    const pluginConfig = basePluginConfig(filteredAudits, filteredGroups);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should throw if onlyAudits is set with a missing audit slug', () => {
    expect(() =>
      filterAuditsAndGroupsByOnlyOptions(
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

  it('should filter group if onlyGroups is set', () => {
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(
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

    expect(filteredAudits).toStrictEqual([{ slug: 'function-coverage' }]);
    expect(filteredGroups).toStrictEqual([
      {
        slug: 'coverage',
        refs: [{ slug: 'function-coverage' }],
      },
    ]);

    const pluginConfig = basePluginConfig(filteredAudits, filteredGroups);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should ignore onlyAudits and only filter groups if onlyGroups and onlyAudits is set', () => {
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(
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

    expect(filteredAudits).toStrictEqual([{ slug: 'function-coverage' }]);
    expect(filteredGroups).toStrictEqual([
      {
        slug: 'coverage',
        refs: [{ slug: 'function-coverage' }],
      },
    ]);

    const pluginConfig = basePluginConfig(filteredAudits, filteredGroups);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should throw if onlyAudits is set with a audit slug that is not implemented', () => {
    expect(() =>
      filterAuditsAndGroupsByOnlyOptions(
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
      filterAuditsAndGroupsByOnlyOptions(
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
