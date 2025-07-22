import { describe, expect, it } from 'vitest';
import { aggregateAndSortGroups, formatGroupsAsTable } from './table.js';

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
        },
        [
          {
            title: 'Feature *',
            patterns: ['**/feature-*.ts'],
          },
          {
            title: 'Feature 2',
            patterns: ['**/feature-2.ts'],
          },
        ],
      ),
    ).toStrictEqual({
      groups: [
        { title: 'Feature 2', totalBytes: 10000, icon: undefined },
        { title: 'Feature *', totalBytes: 8000, icon: undefined },
      ],
      restGroup: { title: 'Rest', totalBytes: 0 },
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
      groups: [{ title: 'Feature 2', totalBytes: 12000, icon: undefined }],
      restGroup: { title: 'Rest', totalBytes: 0 },
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
      groups: [{ title: 'Feature 2', totalBytes: 8000, icon: undefined }],
      restGroup: { title: 'Rest', totalBytes: 12000 },
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
      groups: [{ title: 'Feature 2', totalBytes: 12000, icon: undefined }],
      restGroup: { title: 'Rest', totalBytes: 0 },
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
      groups: [{ title: 'Feature', totalBytes: 8100, icon: undefined }],
      restGroup: { title: 'Rest', totalBytes: 2000 },
    });
  });
});

describe('formatGroupsAsTable', () => {
  it('should add icon to group title', () => {
    expect(
      formatGroupsAsTable({
        groups: [{ title: 'Feature', totalBytes: 10000, icon: '📁' }],
        restGroup: { title: 'Rest', totalBytes: 0 },
      }),
    ).toStrictEqual({
      columns: [
        { key: 'group', label: 'Group', align: 'left' },
        { key: 'size', label: 'Size', align: 'center' },
      ],
      rows: [{ group: '📁 Feature', size: '9.77 kB' }],
    });
  });

  it('should auto-detect group title from patterns', () => {
    expect(
      formatGroupsAsTable({
        groups: [{ title: 'feature-*', totalBytes: 10000 }],
        restGroup: { title: 'Rest', totalBytes: 0 },
      }),
    ).toStrictEqual({
      columns: [
        { key: 'group', label: 'Group', align: 'left' },
        { key: 'size', label: 'Size', align: 'center' },
      ],
      rows: [{ group: 'feature-*', size: '9.77 kB' }],
    });
  });
});
