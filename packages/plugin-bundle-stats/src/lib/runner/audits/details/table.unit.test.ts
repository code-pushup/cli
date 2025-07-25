import { describe, expect, it } from 'vitest';
import type { GroupData } from './grouping.js';
import { aggregateAndSortGroups, createTable } from './table.js';

describe('aggregateAndSortGroups', () => {
  it('should count input files once across groups', () => {
    expect(
      aggregateAndSortGroups(
        {
          'dist/app.js': {
            path: 'dist/app.js',
            bytes: 18000,
            inputs: {
              'src/feature-1.ts': { bytes: 8000 },
              'src/feature-2.ts': { bytes: 10000 },
            },
          },
          'dist/utils.js': {
            path: 'dist/utils.js',
            bytes: 425,
            inputs: {
              'src/feature-1.ts': { bytes: 200 },
              'src/feature-2.ts': { bytes: 225 },
            },
          },
        },
        [
          {
            title: 'Feature 2',
            patterns: ['**/feature-2.ts'],
          },
          {
            title: 'Feature *',
            patterns: ['**/feature-*.ts'],
          },
        ],
      ),
    ).toStrictEqual({
      groups: [
        {
          title: 'Feature 2',
          bytes: 10000,
          icon: undefined,
          modules: 1,
          type: 'group',
        },
        {
          title: 'Feature *',
          bytes: 8000,
          icon: undefined,
          modules: 1,
          type: 'group',
        },
      ],
      restGroup: { title: 'Rest', bytes: 425 },
    });
  });

  it('should include output file bytes when output path matches pattern', () => {
    expect(
      aggregateAndSortGroups(
        {
          'dist/feature-2.js': {
            path: 'dist/feature-2.js',
            bytes: 12000,
            inputs: {
              'src/feature-2.ts': { bytes: 10000 },
            },
          },
        },
        [
          {
            title: 'Feature 2',
            patterns: ['**/feature-2.js'],
          },
        ],
      ),
    ).toStrictEqual({
      groups: [
        {
          title: 'Feature 2',
          bytes: 12000,
          icon: undefined,
          modules: 0,
          type: 'group',
        },
      ],
      restGroup: { title: 'Rest', bytes: 0 },
    });
  });

  it('should assign unmatched bytes to Rest group', () => {
    expect(
      aggregateAndSortGroups(
        {
          'dist/app.js': {
            path: 'dist/app.js',
            bytes: 20000,
            inputs: {
              'src/feature-1.ts': { bytes: 8000 },
              'src/feature-2.ts': { bytes: 8000 },
            },
          },
        },
        [
          {
            title: 'Feature 2',
            patterns: ['**/feature-2.ts'],
          },
        ],
      ),
    ).toStrictEqual({
      groups: [
        {
          title: 'Feature 2',
          bytes: 8000,
          icon: undefined,
          modules: 1,
          type: 'group',
        },
      ],
      restGroup: { title: 'Rest', bytes: 12000 },
    });
  });

  it('should include bundler overhead in Rest group', () => {
    expect(
      aggregateAndSortGroups(
        {
          'dist/feature-2.js': {
            path: 'dist/feature-2.js',
            bytes: 12000,
            inputs: {
              'src/feature-2.ts': { bytes: 10000 },
            },
          },
        },
        [
          {
            title: 'Feature 2',
            patterns: ['**/feature-2.ts'],
          },
        ],
      ),
    ).toStrictEqual({
      groups: [
        {
          title: 'Feature 2',
          bytes: 10000,
          icon: undefined,
          modules: 1,
          type: 'group',
        },
      ],
      restGroup: { title: 'Rest', bytes: 2000 },
    });
  });

  it('should format bytes in human readable format', () => {
    expect(
      aggregateAndSortGroups(
        {
          'dist/app.js': {
            path: 'dist/app.js',
            bytes: 10100,
            inputs: {
              'src/feature.ts': { bytes: 8100 },
            },
          },
        },
        [
          {
            title: 'Feature',
            patterns: ['**/feature.ts'],
          },
        ],
      ),
    ).toStrictEqual({
      groups: [
        {
          title: 'Feature',
          bytes: 8100,
          icon: undefined,
          modules: 1,
          type: 'group',
        },
      ],
      restGroup: { title: 'Rest', bytes: 2000 },
    });
  });
});

describe('createTable', () => {
  it('should add icon to group title', () => {
    expect(
      createTable(
        [
          {
            title: 'Feature',
            bytes: 10000,
            icon: '📁',
            modules: 0,
            type: 'group',
          },
        ],
        { title: 'Rest', bytes: 0 },
      ),
    ).toStrictEqual({
      columns: [
        { key: 'group', label: 'Group', align: 'left' },
        { key: 'modules', label: 'Modules', align: 'right' },
        { key: 'size', label: 'Size', align: 'right' },
      ],
      rows: [{ group: '📁 Feature', modules: '0', size: '9.77 kB' }],
    });
  });

  it('should auto-detect group title from patterns', () => {
    const groups: GroupData[] = [
      {
        title: 'feature-*',
        bytes: 10000,
        modules: 0,
        type: 'group',
      },
    ];

    expect(createTable(groups, { title: 'Rest', bytes: 0 })).toStrictEqual({
      columns: [
        { key: 'group', label: 'Group', align: 'left' },
        { key: 'modules', label: 'Modules', align: 'right' },
        { key: 'size', label: 'Size', align: 'right' },
      ],
      rows: [{ group: '📁 feature-*', modules: '0', size: '9.77 kB' }],
    });
  });
});
