import { expect } from 'vitest';
import {
  Audit,
  Group,
  PluginConfig,
  pluginConfigSchema,
} from '@code-pushup/models';
import {
  AuditsNotImplementedError,
  CategoriesNotImplementedError,
  filterAuditsAndGroupsByOnlyOptions,
  getLighthouseCliArguments,
  validateOnlyAudits,
  validateOnlyCategories,
} from './utils';

describe('getLighthouseCliArguments', () => {
  it('should parse valid options', () => {
    expect(
      getLighthouseCliArguments({
        url: ['https://code-pushup-portal.com'],
      }),
    ).toEqual(expect.arrayContaining(['https://code-pushup-portal.com']));
  });

  it('should parse chrome-flags options correctly', () => {
    const args = getLighthouseCliArguments({
      url: ['https://code-pushup-portal.com'],
      chromeFlags: { headless: 'new', 'user-data-dir': 'test' },
    });
    expect(args).toEqual(
      expect.arrayContaining([
        '--chromeFlags="--headless=new --user-data-dir=test"',
      ]),
    );
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

    expect(filteredAudits).toStrictEqual([
      { slug: 'speed-index', title: 'Speed Index' },
    ]);
    expect(filteredGroups).toStrictEqual([
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
    expect(filteredAudits).toStrictEqual([
      { slug: 'speed-index', title: 'Speed Index' },
    ]);
    expect(filteredGroups).toStrictEqual([
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

    expect(filteredAudits).toStrictEqual([
      { slug: 'function-coverage', title: 'Function Coverage' },
    ]);
    expect(filteredGroups).toStrictEqual([
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

    expect(filteredAudits).toStrictEqual([
      { slug: 'function-coverage', title: 'Function Coverage' },
    ]);
    expect(filteredGroups).toStrictEqual([
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
