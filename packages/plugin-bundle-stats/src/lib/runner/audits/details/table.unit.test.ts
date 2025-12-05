import { describe, expect, it } from 'vitest';
import { aggregateAndSortGroups, createTable } from './table.js';

describe('aggregateAndSortGroups', () => {
  it('should count input files once across groups', () => {
    expect(
      aggregateAndSortGroups(
        {
          'dist/app.js': {
            path: 'dist/app.js',
            bytes: 18_000,
            inputs: {
              'src/feature-1.ts': { bytes: 8000 },
              'src/feature-2.ts': { bytes: 10_000 },
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
        {
          groups: [
            {
              title: 'Feature 2',
              includeInputs: ['**/feature-2.ts'],
            },
            {
              title: 'Feature *',
              includeInputs: ['**/feature-*.ts'],
            },
          ],
        },
      ),
    ).toStrictEqual({
      groups: [
        {
          title: 'Feature 2',
          bytes: 10_000,
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
            bytes: 12_000,
            inputs: {
              'src/feature-2.ts': { bytes: 10_000 },
            },
          },
        },
        {
          groups: [
            {
              title: 'Feature 2',
              includeInputs: ['**/feature-2.js'],
            },
          ],
        },
      ),
    ).toStrictEqual({
      groups: [
        {
          title: 'Feature 2',
          bytes: 12_000,
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
            bytes: 20_000,
            inputs: {
              'src/feature-1.ts': { bytes: 8000 },
              'src/feature-2.ts': { bytes: 8000 },
            },
          },
        },
        {
          groups: [
            {
              title: 'Feature 2',
              includeInputs: ['**/feature-2.ts'],
            },
          ],
        },
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
      restGroup: { title: 'Rest', bytes: 12_000 },
    });
  });

  it('should include bundler overhead in Rest group', () => {
    expect(
      aggregateAndSortGroups(
        {
          'dist/feature-2.js': {
            path: 'dist/feature-2.js',
            bytes: 12_000,
            inputs: {
              'src/feature-2.ts': { bytes: 10_000 },
            },
          },
        },
        {
          groups: [
            {
              title: 'Feature 2',
              includeInputs: ['**/feature-2.ts'],
            },
          ],
        },
      ),
    ).toStrictEqual({
      groups: [
        {
          title: 'Feature 2',
          bytes: 10_000,
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
            bytes: 10_100,
            inputs: {
              'src/feature.ts': { bytes: 8100 },
            },
          },
        },
        {
          groups: [
            {
              title: 'Feature',
              includeInputs: ['**/feature.ts'],
            },
          ],
        },
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

  it('should handle include/exclude patterns', () => {
    expect(
      aggregateAndSortGroups(
        {
          'dist/app.js': {
            path: 'dist/app.js',
            bytes: 25_000,
            inputs: {
              'src/index.ts': { bytes: 5000 },
              'src/feature-1.ts': { bytes: 10_000 },
              'src/feature-2.ts': { bytes: 7500 },
              'src/utils/format.ts': { bytes: 2500 },
            },
          },
        },
        {
          groups: [
            {
              title: 'Application Code',
              includeInputs: '**/src/**',
              excludeInputs: ['**/utils/**', '**/*.spec.ts'],
            },
          ],
        },
      ),
    ).toStrictEqual({
      groups: [
        {
          title: 'Application Code',
          bytes: 22_500, // 5000 + 10000 + 7500 (excluding utils)
          icon: undefined,
          modules: 3,
          type: 'group',
        },
      ],
      restGroup: { title: 'Rest', bytes: 2500 }, // 2500 from utils + any bundler overhead
    });
  });

  it('should handle multiple groups with icons', () => {
    expect(
      aggregateAndSortGroups(
        {
          'dist/app.js': {
            path: 'dist/app.js',
            bytes: 50_000,
            inputs: {
              'src/feature-1.ts': { bytes: 10_000 },
              'src/utils/format.ts': { bytes: 5000 },
              'node_modules/lodash/index.js': { bytes: 15_000 },
            },
          },
        },
        {
          groups: [
            {
              title: 'Features',
              includeInputs: '**/feature-*.ts',
              icon: '🎯',
            },
            {
              title: 'Utilities',
              includeInputs: '**/utils/**',
              icon: '🔧',
            },
            {
              title: 'Dependencies',
              includeInputs: 'node_modules/**',
              icon: '📦',
            },
          ],
        },
      ),
    ).toStrictEqual({
      groups: [
        {
          title: 'Dependencies',
          bytes: 15_000,
          icon: '📦',
          modules: 1,
          type: 'group',
        },
        {
          title: 'Features',
          bytes: 10_000,
          icon: '🎯',
          modules: 1,
          type: 'group',
        },
        {
          title: 'Utilities',
          bytes: 5000,
          icon: '🔧',
          modules: 1,
          type: 'group',
        },
      ],
      restGroup: { title: 'Rest', bytes: 20_000 },
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
            bytes: 10_000,
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

  it('should handle groups without icons', () => {
    expect(
      createTable(
        [
          {
            title: 'Feature',
            bytes: 10_000,
            modules: 2,
            type: 'group',
          },
        ],
        { title: 'Rest', bytes: 1000 },
      ),
    ).toStrictEqual({
      columns: [
        { key: 'group', label: 'Group', align: 'left' },
        { key: 'modules', label: 'Modules', align: 'right' },
        { key: 'size', label: 'Size', align: 'right' },
      ],
      rows: [
        { group: 'Feature', modules: '2', size: '9.77 kB' },
        { group: 'Rest', modules: '-', size: '1000 B' },
      ],
    });
  });

  it('should handle onlyMatching mode by filtering zero-byte groups', () => {
    expect(
      createTable(
        [
          {
            title: 'Feature 1',
            bytes: 10_000,
            modules: 1,
            type: 'group',
          },
          {
            title: 'Feature 2',
            bytes: 0,
            modules: 0,
            type: 'group',
          },
        ],
        { title: 'Rest', bytes: 0 },
        'onlyMatching',
      ),
    ).toStrictEqual({
      columns: [
        { key: 'group', label: 'Group', align: 'left' },
        { key: 'modules', label: 'Modules', align: 'right' },
        { key: 'size', label: 'Size', align: 'right' },
      ],
      rows: [{ group: 'Feature 1', modules: '1', size: '9.77 kB' }],
    });
  });

  it('should show all groups in all mode including zero-byte groups', () => {
    expect(
      createTable(
        [
          {
            title: 'Feature 1',
            bytes: 10_000,
            modules: 1,
            type: 'group',
          },
          {
            title: 'Feature 2',
            bytes: 0,
            modules: 0,
            type: 'group',
          },
        ],
        { title: 'Rest', bytes: 5000 },
        'all',
      ),
    ).toStrictEqual({
      columns: [
        { key: 'group', label: 'Group', align: 'left' },
        { key: 'modules', label: 'Modules', align: 'right' },
        { key: 'size', label: 'Size', align: 'right' },
      ],
      rows: [
        { group: 'Feature 1', modules: '1', size: '9.77 kB' },
        { group: 'Feature 2', modules: '0', size: '0 B' },
        { group: 'Rest', modules: '-', size: '4.88 kB' },
      ],
    });
  });

  it('should apply pruning with maxChildren', () => {
    expect(
      createTable(
        [
          { title: 'Feature 1', bytes: 10_000, modules: 1, type: 'group' },
          { title: 'Feature 2', bytes: 8000, modules: 1, type: 'group' },
          { title: 'Feature 3', bytes: 6000, modules: 1, type: 'group' },
          { title: 'Feature 4', bytes: 4000, modules: 1, type: 'group' },
        ],
        { title: 'Rest', bytes: 2000 },
        'all',
        { enabled: true, maxChildren: 2 },
      ),
    ).toStrictEqual({
      columns: [
        { key: 'group', label: 'Group', align: 'left' },
        { key: 'modules', label: 'Modules', align: 'right' },
        { key: 'size', label: 'Size', align: 'right' },
      ],
      rows: [
        { group: 'Feature 1', modules: '1', size: '9.77 kB' },
        { group: 'Feature 2', modules: '1', size: '7.81 kB' },
        { group: 'Rest', modules: '-', size: '11.72 kB' }, // 6000 + 4000 + 2000
      ],
    });
  });

  it('should apply pruning with minSize', () => {
    expect(
      createTable(
        [
          { title: 'Large Feature', bytes: 50_000, modules: 1, type: 'group' },
          { title: 'Medium Feature', bytes: 30_000, modules: 1, type: 'group' },
          { title: 'Small Feature', bytes: 5000, modules: 1, type: 'group' },
        ],
        { title: 'Rest', bytes: 1000 },
        'all',
        { enabled: true, minSize: 25_000 },
      ),
    ).toStrictEqual({
      columns: [
        { key: 'group', label: 'Group', align: 'left' },
        { key: 'modules', label: 'Modules', align: 'right' },
        { key: 'size', label: 'Size', align: 'right' },
      ],
      rows: [
        { group: 'Large Feature', modules: '1', size: '48.83 kB' },
        { group: 'Medium Feature', modules: '1', size: '29.3 kB' },
        { group: 'Rest', modules: '-', size: '5.86 kB' }, // 5000 + 1000
      ],
    });
  });
});
