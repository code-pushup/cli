import {
  getSortableAuditByRef,
  getSortableGroupByRef,
  getSortedGroupAudits,
} from './sorting.js';
import type { SortableAuditReport, SortableGroup } from './types.js';

describe('getSortableAuditByRef', () => {
  it('should return a sortable audit', () => {
    expect(
      getSortableAuditByRef(
        {
          slug: 'function-coverage',
          weight: 6,
          plugin: 'coverage',
          type: 'audit',
        },
        [
          {
            slug: 'coverage',
            date: 'today',
            duration: 0,
            title: 'Coverage',
            icon: 'folder-coverage-open',
            audits: [
              {
                slug: 'function-coverage',
                score: 1,
                title: 'Function coverage',
                value: 100,
              },
            ],
            groups: [],
          },
        ],
      ),
    ).toStrictEqual<SortableAuditReport>({
      slug: 'function-coverage',
      title: 'Function coverage',
      score: 1,
      value: 100,
      weight: 6,
      plugin: 'coverage',
    });
  });

  it('should throw for a non-existent audit', () => {
    expect(() =>
      getSortableAuditByRef(
        {
          slug: 'pancake-coverage',
          weight: 2,
          plugin: 'coverage',
          type: 'audit',
        },
        [
          {
            slug: 'coverage',
            date: 'today',
            duration: 0,
            title: 'Coverage',
            icon: 'folder-coverage-open',
            audits: [
              {
                slug: 'branch-coverage',
                score: 0.5,
                title: 'Branch coverage',
                value: 50,
              },
            ],
            groups: [],
          },
        ],
      ),
    ).toThrow('Audit pancake-coverage is not present in coverage');
  });
});

describe('getSortableGroupByRef', () => {
  it('should return a sortable group with references sorted based on score > weight > value > title', () => {
    expect(
      getSortableGroupByRef(
        {
          slug: 'code-coverage',
          weight: 2,
          plugin: 'coverage',
          type: 'group',
        },
        [
          {
            slug: 'coverage',
            date: 'today',
            duration: 0,
            title: 'Coverage',
            icon: 'folder-coverage-open',
            audits: [
              {
                slug: 'function-coverage',
                score: 1,
                title: 'Function coverage',
                value: 100,
              },
              {
                slug: 'branch-coverage',
                score: 0.5,
                title: 'Branch coverage',
                value: 50,
              },
            ],
            groups: [
              {
                slug: 'code-coverage',
                title: 'Code coverage',
                score: 0.66,
                refs: [
                  {
                    slug: 'branch-coverage',
                    weight: 1,
                  },
                  {
                    slug: 'function-coverage',
                    weight: 2,
                  },
                ],
              },
            ],
          },
        ],
      ),
    ).toStrictEqual<SortableGroup>({
      slug: 'code-coverage',
      title: 'Code coverage',
      score: 0.66,
      refs: [
        {
          slug: 'branch-coverage',
          weight: 1,
        },
        {
          slug: 'function-coverage',
          weight: 2,
        },
      ],
      weight: 2,
      plugin: 'coverage',
    });
  });

  it('should throw for a non-existent group', () => {
    expect(() =>
      getSortableGroupByRef(
        {
          slug: 'test-coverage',
          weight: 2,
          plugin: 'coverage',
          type: 'group',
        },
        [
          {
            slug: 'coverage',
            date: 'today',
            duration: 0,
            title: 'Coverage',
            icon: 'folder-coverage-open',
            audits: [
              {
                slug: 'function-coverage',
                score: 0.75,
                title: 'Function coverage',
                value: 75,
              },
            ],
            groups: [],
          },
        ],
      ),
    ).toThrow('Group test-coverage is not present in coverage');
  });
});

describe('getSortedGroupAudits', () => {
  it('should return sorted group audits based on score > weight > value > title', () => {
    expect(
      getSortedGroupAudits(
        {
          slug: 'code-coverage',
          title: 'Code coverage',
          refs: [
            { slug: 'branch-coverage', weight: 3 },
            { slug: 'function-coverage', weight: 6 },
            { slug: 'line-coverage', weight: 3 },
          ],
        },
        'coverage',
        [
          {
            slug: 'coverage',
            date: 'today',
            duration: 0,
            title: 'Coverage',
            icon: 'folder-coverage-open',
            audits: [
              {
                slug: 'branch-coverage',
                score: 0.75,
                title: 'Branch coverage',
                value: 75,
              },
              {
                slug: 'function-coverage',
                score: 1,
                title: 'Function coverage',
                value: 100,
              },
              {
                slug: 'line-coverage',
                score: 0.5,
                title: 'Line coverage',
                value: 50,
              },
            ],
            groups: [],
          },
        ],
      ),
    ).toStrictEqual([
      expect.objectContaining({
        weight: 3,
        score: 0.5,
        slug: 'line-coverage',
      }),
      expect.objectContaining({
        weight: 3,
        score: 0.75,
        slug: 'branch-coverage',
      }),
      expect.objectContaining({
        weight: 6,
        slug: 'function-coverage',
      }),
    ]);
  });
});
