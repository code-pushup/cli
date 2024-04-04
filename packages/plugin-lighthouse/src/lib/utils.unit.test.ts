import { describe, expect, it } from 'vitest';
import {
  Audit,
  Group,
  PluginConfig,
  categoryRefSchema,
  pluginConfigSchema,
} from '@code-pushup/models';
import {
  AuditsNotImplementedError,
  CategoriesNotImplementedError,
  filterAuditsAndGroupsByOnlyOptions,
  lighthouseAuditRef,
  lighthouseGroupRef,
  validateOnlyAudits,
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

describe('validateOnlyAudits', () => {
  it('should not throw for audit slugs existing in given audits', () => {
    expect(
      validateOnlyAudits(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
        ],
        'a',
      ),
    ).toBeTruthy();
  });

  it('should throw if given onlyAudits do not exist', () => {
    expect(() =>
      validateOnlyAudits(
        [
          { slug: 'a', title: 'A' },
          { slug: 'b', title: 'B' },
          { slug: 'c', title: 'C' },
        ],
        'missing-audit',
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
  it('should return given audits and groups if no only filter is set', () => {
    const audits: Audit[] = [{ slug: 'speed-index', title: 'Speed Index' }];
    const groups: Group[] = [
      {
        slug: 'performance',
        title: 'Performance',
        refs: [{ slug: 'speed-index', weight: 1 }],
      },
    ];
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(audits, groups, {});

    expect(filteredAudits).toStrictEqual(audits);
    expect(filteredGroups).toStrictEqual(groups);

    const pluginConfig: PluginConfig = {
      slug: 'coverage',
      title: 'Code Coverage',
      icon: 'file',
      description: 'Runs test coverage and created audits',
      audits: filteredAudits,
      groups: filteredGroups,
      runner: {
        command: 'node',
        outputFile: 'out.json',
      },
    };

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should filter audits if onlyAudits is set', () => {
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(
        [
          { slug: 'speed-index', title: 'Speed Index' },
          { slug: 'first-contentful-paint', title: 'First Contentful Paint' },
        ],
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
        ],
        { onlyAudits: ['speed-index'] },
      );

    expect(filteredAudits).toStrictEqual<Audit[]>([
      { slug: 'speed-index', title: 'Speed Index' },
    ]);
    expect(filteredGroups).toStrictEqual<Group[]>([
      {
        slug: 'performance',
        title: 'Performance',
        refs: [{ slug: 'speed-index', weight: 1 }],
      },
    ]);

    const pluginConfig: PluginConfig = {
      slug: 'coverage',
      title: 'Code Coverage',
      icon: 'file',
      description: 'Runs test coverage and created audits',
      audits: filteredAudits,
      groups: filteredGroups,
      runner: {
        command: 'node',
        outputFile: 'out.json',
      },
    };

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should throw if onlyAudits is set with a missing audit slug', () => {
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(
        [
          { slug: 'speed-index', title: 'Speed Index' },
          { slug: 'first-contentful-paint', title: 'First Contentful Paint' },
        ],
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
        ],
        { onlyAudits: ['speed-index'] },
      );
    expect(filteredAudits).toStrictEqual<Audit[]>([
      { slug: 'speed-index', title: 'Speed Index' },
    ]);
    expect(filteredGroups).toStrictEqual<Group[]>([
      {
        slug: 'performance',
        title: 'Performance',
        refs: [{ slug: 'speed-index', weight: 1 }],
      },
    ]);

    const pluginConfig: PluginConfig = {
      slug: 'coverage',
      title: 'Code Coverage',
      icon: 'file',
      description: 'Runs test coverage and created audits',
      audits: filteredAudits,
      groups: filteredGroups,
      runner: {
        command: 'node',
        outputFile: 'out.json',
      },
    };

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should filter categories if onlyCategories is set', () => {
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(
        [
          { slug: 'speed-index', title: 'Speed Index' },
          { slug: 'first-contentful-paint', title: 'First Contentful Paint' },
          { slug: 'function-coverage', title: 'Function Coverage' },
        ],
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
        { onlyCategories: ['coverage'] },
      );

    expect(filteredAudits).toStrictEqual<Audit[]>([
      { slug: 'function-coverage', title: 'Function Coverage' },
    ]);
    expect(filteredGroups).toStrictEqual<Group[]>([
      {
        slug: 'coverage',
        title: 'Code coverage',
        refs: [{ slug: 'function-coverage', weight: 1 }],
      },
    ]);

    const pluginConfig: PluginConfig = {
      slug: 'coverage',
      title: 'Code Coverage',
      icon: 'file',
      description: 'Runs test coverage and created audits',
      audits: filteredAudits,
      groups: filteredGroups,
      runner: {
        command: 'node',
        outputFile: 'out.json',
      },
    };

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should ignore onlyAudits and only filter categories if onlyCategories and onlyAudits is set', () => {
    const { audits: filteredAudits, groups: filteredGroups } =
      filterAuditsAndGroupsByOnlyOptions(
        [
          { slug: 'speed-index', title: 'Speed Index' },
          { slug: 'first-contentful-paint', title: 'First Contentful Paint' },
          { slug: 'function-coverage', title: 'Function Coverage' },
        ],
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
        {
          onlyAudits: ['speed-index'],
          onlyCategories: ['coverage'],
        },
      );

    expect(filteredAudits).toStrictEqual<Audit[]>([
      { slug: 'function-coverage', title: 'Function Coverage' },
    ]);
    expect(filteredGroups).toStrictEqual<Group[]>([
      {
        slug: 'coverage',
        title: 'Code coverage',
        refs: [{ slug: 'function-coverage', weight: 1 }],
      },
    ]);

    const pluginConfig: PluginConfig = {
      slug: 'coverage',
      title: 'Code Coverage',
      icon: 'file',
      description: 'Runs test coverage and created audits',
      audits: filteredAudits,
      groups: filteredGroups,
      runner: {
        command: 'node',
        outputFile: 'out.json',
      },
    };

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
  });

  it('should throw if onlyAudits is set with a audit slug that is not implemented', () => {
    expect(() =>
      filterAuditsAndGroupsByOnlyOptions(
        [{ slug: 'speed-index', title: 'Speed Index' }],
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
        ],
        {
          onlyAudits: ['missing-audit'],
        },
      ),
    ).toThrow(new AuditsNotImplementedError(['missing-audit']));
  });

  it('should throw if onlyCategories is set with a category slug that is not implemented', () => {
    expect(() =>
      filterAuditsAndGroupsByOnlyOptions(
        [{ slug: 'speed-index', title: 'Speed Index' }],
        [
          {
            slug: 'performance',
            title: 'Performance',
            refs: [{ slug: 'speed-index', weight: 1 }],
          },
        ],
        {
          onlyCategories: ['missing-category'],
        },
      ),
    ).toThrow(new CategoriesNotImplementedError(['missing-category']));
  });
});
