import type { Group } from '@code-pushup/models';
import { AUDITS_MAP } from './constants';
import { filterAuditsByPluginConfig, filterGroupsByOnlyAudits } from './utils';

describe('filterAuditsByPluginConfig', () => {
  it('should return all audits when onlyAudits is not provided', () => {
    const result = filterAuditsByPluginConfig({});
    expect(result).toStrictEqual(Object.values(AUDITS_MAP));
  });

  it('should return all audits when onlyAudits is empty array', () => {
    const result = filterAuditsByPluginConfig({ onlyAudits: [] });
    expect(result).toStrictEqual(Object.values(AUDITS_MAP));
  });

  it('should return only specified audits when onlyAudits is provided', () => {
    const onlyAudits = ['functions-coverage', 'classes-coverage'];
    const result = filterAuditsByPluginConfig({ onlyAudits });

    expect(result).toStrictEqual(
      Object.values(AUDITS_MAP).filter(audit =>
        onlyAudits.includes(audit.slug),
      ),
    );
  });
});

describe('filterGroupsByOnlyAudits', () => {
  const mockGroups: Group[] = [
    {
      title: 'Group 1',
      slug: 'group-1',
      refs: [
        { slug: 'functions-coverage', weight: 1 },
        { slug: 'classes-coverage', weight: 1 },
      ],
    },
    {
      title: 'Group 2',
      slug: 'group-2',
      refs: [
        { slug: 'types-coverage', weight: 1 },
        { slug: 'interfaces-coverage', weight: 1 },
      ],
    },
  ];

  it('should return all groups when onlyAudits is not provided', () => {
    const result = filterGroupsByOnlyAudits(mockGroups, {});
    expect(result).toStrictEqual(mockGroups);
  });

  it('should return all groups when onlyAudits is empty array', () => {
    const result = filterGroupsByOnlyAudits(mockGroups, { onlyAudits: [] });
    expect(result).toStrictEqual(mockGroups);
  });

  it('should filter groups based on specified audits', () => {
    const result = filterGroupsByOnlyAudits(mockGroups, {
      onlyAudits: ['functions-coverage'],
    });

    expect(result).toStrictEqual([
      {
        title: 'Group 1',
        slug: 'group-1',
        refs: [{ slug: 'functions-coverage', weight: 1 }],
      },
    ]);
  });

  it('should remove groups with no matching refs', () => {
    const result = filterGroupsByOnlyAudits(mockGroups, {
      onlyAudits: ['enums-coverage'],
    });

    expect(result).toStrictEqual([]);
  });
});
