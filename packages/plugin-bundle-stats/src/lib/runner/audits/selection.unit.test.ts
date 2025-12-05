import { describe, expect, it } from 'vitest';
import { normalizeSelectionOptions } from '../../normalize.js';
import type { UnifiedStats } from '../unify/unified-stats.types.js';
import { compileSelectionPatterns, selectBundles } from './selection.js';

describe('compileSelectionPatterns', () => {
  it('should return object with correct structure for all pattern types', () => {
    const result = compileSelectionPatterns({
      mode: 'bundle',
      includeOutputs: ['dist/**/*.js'],
      excludeOutputs: ['dist/**/*.map'],
      includeInputs: ['src/**/*.ts'],
      excludeInputs: ['**/*.test.ts'],
    });

    expect(result).toStrictEqual({
      includeOutputs: [expect.any(Function)],
      excludeOutputs: [expect.any(Function)],
      includeInputs: [expect.any(Function)],
      excludeInputs: [expect.any(Function)],
    });
    expect([
      result.includeOutputs[0]!('dist/main.js'),
      result.includeOutputs[0]!('dist/main.map'),
    ]).toEqual([true, false]);
  });

  it('should handle empty selection options', () => {
    expect(
      compileSelectionPatterns({
        mode: 'bundle',
        includeOutputs: [],
        excludeOutputs: [],
        includeInputs: [],
        excludeInputs: [],
      }),
    ).toStrictEqual({
      includeOutputs: [],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
    });
  });

  it('should merge global include/exclude patterns', () => {
    const result = compileSelectionPatterns(
      normalizeSelectionOptions({
        include: ['src/**'],
        exclude: ['*.test.*'],
        includeOutputs: ['main.js'],
        excludeOutputs: ['dev.js'],
        includeInputs: ['components/**'],
        excludeInputs: ['temp.js'],
      }),
    );

    expect(
      [
        result.includeOutputs,
        result.excludeOutputs,
        result.includeInputs,
        result.excludeInputs,
      ].map(arr => arr.length),
    ).toEqual([2, 2, 2, 2]);
  });

  it('should work with type configurations', () => {
    const result = compileSelectionPatterns({
      mode: 'bundle' as const,
      includeOutputs: ['*.js'],
      excludeOutputs: ['*.test.js'],
      includeInputs: [],
      excludeInputs: [],
    });

    expect([
      result.includeOutputs[0]!('main.js'),
      result.excludeOutputs[0]!('main.test.js'),
    ]).toEqual([true, true]);
  });
});

describe('selectBundles', () => {
  const empty = {
    mode: 'bundle' as const,
    includeOutputs: [],
    excludeOutputs: [],
    includeInputs: [],
    excludeInputs: [],
  };

  const stats: UnifiedStats = {
    'dist/index.js': {
      path: 'dist/index.js',
      bytes: 5000,
      inputs: {
        'src/index.ts': { bytes: 1000 },
        'src/lib/feature-1.ts': { bytes: 1000 },
        'src/lib/utils/format.ts': { bytes: 1000 },
        'src/lib/utils/math.ts': { bytes: 1000 },
        'src/lib/feature-2.ts': { bytes: 1000 },
      },
      imports: [
        { path: 'dist/chunks/chunk-U6O5K65G.js', kind: 'import-statement' },
        { path: 'dist/chunks/feature-2-X2YVDBQK.js', kind: 'dynamic-import' },
      ],
    },
    'dist/bin.js': {
      path: 'dist/bin.js',
      bytes: 3000,
      inputs: {
        'src/bin.ts': { bytes: 500 },
        'src/lib/feature-1.ts': { bytes: 1000 },
        'src/lib/utils/format.ts': { bytes: 1000 },
        'src/lib/utils/math.ts': { bytes: 500 },
      },
      imports: [
        { path: 'dist/chunks/chunk-U6O5K65G.js', kind: 'import-statement' },
      ],
    },
    'dist/chunks/chunk-U6O5K65G.js': {
      path: 'dist/chunks/chunk-U6O5K65G.js',
      bytes: 2000,
      inputs: {
        'src/lib/utils/format.ts': { bytes: 1000 },
        'src/lib/feature-1.ts': { bytes: 500 },
        'src/lib/utils/math.ts': { bytes: 500 },
      },
    },
    'dist/chunks/feature-2-X2YVDBQK.js': {
      path: 'dist/chunks/feature-2-X2YVDBQK.js',
      bytes: 1000,
      inputs: {
        'src/lib/feature-2.ts': { bytes: 1000 },
      },
    },
  };

  it('should return empty result for empty stats', () => {
    expect(
      selectBundles({}, { ...empty, includeOutputs: ['*.js'] }),
    ).toStrictEqual({});
  });

  it('should throw error for empty selection options', () => {
    expect(() => selectBundles({}, empty)).toThrow(
      'Selection requires at least one include/exclude pattern',
    );
    expect(() =>
      selectBundles(
        { 'main.js': { path: 'dist/main.js', bytes: 0, inputs: {} } },
        empty,
      ),
    ).toThrow('Provide patterns like');
  });

  // Byte Inclusion Tests
  it('should select output and dependencies (Include Output)', () => {
    expect(
      Object.keys(
        selectBundles(stats, {
          ...empty,
          mode: 'withStartupDeps',
          includeOutputs: ['**/dist/index.js'],
        }),
      ),
    ).toEqual(['dist/index.js', 'dist/chunks/chunk-U6O5K65G.js']);
  });

  it('should include static imports only (Include Output)', () => {
    const result = selectBundles(stats, {
      ...empty,
      mode: 'withStartupDeps',
      includeOutputs: ['**/dist/index.js'],
    });
    expect([
      !!result['dist/chunks/chunk-U6O5K65G.js'],
      !!result['dist/chunks/feature-2-X2YVDBQK.js'],
    ]).toEqual([true, false]);
  });

  it('should select only bundle file in bundle mode', () => {
    expect(
      Object.keys(
        selectBundles(stats, {
          ...empty,
          mode: 'bundle',
          includeOutputs: ['**/dist/index.js'],
        }),
      ),
    ).toEqual(['dist/index.js']);
  });

  it('should exclude files by pattern (Include/Exclude Output)', () => {
    expect(
      Object.keys(
        selectBundles(stats, {
          ...empty,
          includeOutputs: ['**/*'],
          excludeOutputs: ['**/bin.js'],
        }),
      ),
    ).toEqual([
      'dist/index.js',
      'dist/chunks/chunk-U6O5K65G.js',
      'dist/chunks/feature-2-X2YVDBQK.js',
    ]);
  });

  it('should prioritize exclude over include', () => {
    expect(
      selectBundles(stats, {
        ...empty,
        includeOutputs: ['**/dist/index.js'],
        excludeOutputs: ['**/dist/index.js'],
      }),
    ).toStrictEqual({});
  });

  it('should select by input files (Include Input)', () => {
    expect(
      Object.keys(
        selectBundles(stats, { ...empty, includeInputs: ['**/feature-2.ts'] }),
      ),
    ).toEqual(['dist/index.js', 'dist/chunks/feature-2-X2YVDBQK.js']);
  });

  it('should select by utility files (Include Input)', () => {
    expect(
      Object.keys(
        selectBundles(stats, {
          ...empty,
          includeInputs: ['**/utils/format.ts'],
        }),
      ),
    ).toEqual([
      'dist/index.js',
      'dist/bin.js',
      'dist/chunks/chunk-U6O5K65G.js',
    ]);
  });

  it('should exclude by input files (Include/Exclude Input)', () => {
    expect(
      Object.keys(
        selectBundles(stats, {
          ...empty,
          includeOutputs: ['**/*'],
          excludeInputs: ['**/feature-2.ts'],
        }),
      ),
    ).toEqual(['dist/bin.js', 'dist/chunks/chunk-U6O5K65G.js']);
  });

  it('should exclude utility files', () => {
    const result = selectBundles(stats, {
      ...empty,
      includeOutputs: ['**/*'],
      excludeInputs: ['**/utils/**'],
    });
    Object.values(result).forEach(
      output =>
        output?.inputs &&
        expect(
          Object.keys(output.inputs).every(path => !path.includes('utils')),
        ).toBe(true),
    );
  });

  it('should handle complex filtering (Include/Exclude Mixed)', () => {
    expect(
      Object.keys(
        selectBundles(stats, {
          ...empty,
          includeOutputs: ['**/index.js', '**/chunks/**'],
          excludeOutputs: ['**/bin.js'],
          excludeInputs: ['**/utils/**'],
        }),
      ),
    ).not.toContain('dist/bin.js');
  });

  it('should combine include patterns with OR logic', () => {
    expect(
      Object.keys(
        selectBundles(stats, {
          ...empty,
          includeOutputs: ['**/index.js', '**/bin.js'],
          excludeInputs: ['**/feature-2.ts'],
        }),
      ),
    ).toEqual(['dist/bin.js']);
  });

  // Dependency Inclusion Tests
  it('should filter inputs in matchingOnly mode', () => {
    const result = selectBundles(stats, {
      ...empty,
      mode: 'matchingOnly',
      includeInputs: ['**/utils/format.ts'],
    });
    Object.values(result).forEach(
      output =>
        output?.inputs &&
        expect(
          Object.keys(output.inputs).every(path => path.includes('format.ts')),
        ).toBe(true),
    );
  });

  it('should exclude bundler overhead in matchingOnly mode', () => {
    const result = selectBundles(stats, {
      ...empty,
      mode: 'matchingOnly',
      includeInputs: ['**/feature-1.ts'],
    });
    Object.values(result).forEach(output => {
      if (output?.inputs) {
        const inputBytes = Object.values(output.inputs).reduce(
          (sum, input) => sum + (input?.bytes || 0),
          0,
        );
        expect(output.bytes).toBeLessThanOrEqual(inputBytes);
      }
    });
  });

  it('should include full bundle with overhead (Mode: bundle)', () => {
    const result = selectBundles(stats, {
      ...empty,
      mode: 'bundle',
      includeOutputs: ['**/dist/index.js'],
    });
    expect([
      result['dist/index.js']?.bytes,
      Object.keys(result).length,
    ]).toEqual([5000, 1]);
  });

  it('should preserve bundled inputs (Mode: bundle)', () => {
    expect(
      Object.keys(
        selectBundles(stats, {
          ...empty,
          mode: 'bundle',
          includeOutputs: ['**/dist/bin.js'],
        })['dist/bin.js']?.inputs || {},
      ),
    ).toHaveLength(4);
  });

  it('should include static imports (Mode: withStartupDeps)', () => {
    const result = selectBundles(stats, {
      ...empty,
      mode: 'withStartupDeps',
      includeOutputs: ['**/dist/index.js'],
    });
    expect([
      !!result['dist/chunks/chunk-U6O5K65G.js'],
      !!result['dist/chunks/feature-2-X2YVDBQK.js'],
    ]).toEqual([true, false]);
  });

  it('should exclude static imports by pattern (Mode: withStartupDeps)', () => {
    expect(
      selectBundles(stats, {
        ...empty,
        mode: 'withStartupDeps',
        includeOutputs: ['**/dist/index.js'],
        excludeOutputs: ['**/chunks/**'],
      })['dist/chunks/chunk-U6O5K65G.js'],
    ).toBeUndefined();
  });

  it('should include all imports (Mode: withAllDeps)', () => {
    const result = selectBundles(stats, {
      ...empty,
      mode: 'withAllDeps',
      includeOutputs: ['**/dist/index.js'],
    });
    expect([
      !!result['dist/chunks/chunk-U6O5K65G.js'],
      !!result['dist/chunks/feature-2-X2YVDBQK.js'],
    ]).toEqual([true, true]);
  });

  it('should exclude dependencies that match exclude patterns (Mode: withAllDeps)', () => {
    expect(
      selectBundles(stats, {
        ...empty,
        mode: 'withAllDeps',
        includeOutputs: ['**/dist/index.js'],
        excludeOutputs: ['**/chunks/**'],
      }),
    ).toStrictEqual({ 'dist/index.js': stats['dist/index.js'] });
  });

  it('should handle nested dependency chains (Mode: withAllDeps)', () => {
    const nestedStats = {
      'dist/nested.js': {
        path: 'dist/nested.js',
        bytes: 1000,
        inputs: {},
        imports: [{ path: 'dist/level1.js', kind: 'import-statement' }],
      },
      'dist/level1.js': {
        path: 'dist/level1.js',
        bytes: 500,
        inputs: {},
        imports: [{ path: 'dist/level2.js', kind: 'dynamic-import' }],
      },
      'dist/level2.js': { path: 'dist/level2.js', bytes: 200, inputs: {} },
    } as unknown as UnifiedStats;

    expect(
      Object.keys(
        selectBundles(nestedStats, {
          ...empty,
          mode: 'withAllDeps',
          includeOutputs: ['**/nested.js'],
        }),
      ),
    ).toEqual(['dist/nested.js', 'dist/level1.js']);
  });
});
