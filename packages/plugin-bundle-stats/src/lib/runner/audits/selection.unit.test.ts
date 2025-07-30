import { describe, expect, it, vi } from 'vitest';
import { normalizeSelectionOptions } from '../../normalize.js';
import type { SelectionGeneralConfig } from '../../types.js';
import type { UnifiedStats } from '../unify/unified-stats.types.js';
import { compilePattern } from './details/grouping.js';
import {
  type CompiledPatterns,
  type SelectionConfig,
  compileSelectionPatterns,
  evaluatePatternCriteria,
  getImportPaths,
  getInputPaths,
  importsMatchPatterns,
  inputsMatchPatterns,
  isBundleSelected,
  selectBundles,
} from './selection.js';

describe('evaluatePatternCriteria', () => {
  const createMatcher = (pattern: string) => (path: string) =>
    path.includes(pattern);

  it('should return true when no include or exclude patterns are provided', () => {
    expect(evaluatePatternCriteria(['src/main.js'], [], [])).toBe(true);
  });

  it('should return true when paths match include patterns', () => {
    expect(
      evaluatePatternCriteria(['src/main.js'], [createMatcher('src')], []),
    ).toBe(true);
  });

  it('should return false when no paths match include patterns', () => {
    expect(
      evaluatePatternCriteria(['dist/main.js'], [createMatcher('src')], []),
    ).toBe(false);
  });

  it('should return false when paths match exclude patterns', () => {
    expect(
      evaluatePatternCriteria(
        ['node_modules/react.js'],
        [],
        [createMatcher('node_modules')],
      ),
    ).toBe(false);
  });

  it('should return true when no paths match exclude patterns', () => {
    expect(
      evaluatePatternCriteria(
        ['src/main.js'],
        [],
        [createMatcher('node_modules')],
      ),
    ).toBe(true);
  });

  it('should return true when paths match include but not exclude patterns', () => {
    expect(
      evaluatePatternCriteria(
        ['src/main.js'],
        [createMatcher('src')],
        [createMatcher('test')],
      ),
    ).toBe(true);
  });

  it('should return false when paths match both include and exclude patterns', () => {
    expect(
      evaluatePatternCriteria(
        ['src/test/main.js'],
        [createMatcher('src')],
        [createMatcher('test')],
      ),
    ).toBe(false);
  });

  it('should return false when paths match exclude even if they match include', () => {
    expect(
      evaluatePatternCriteria(
        ['main.backup.js'],
        [createMatcher('main')],
        [createMatcher('backup')],
      ),
    ).toBe(false);
  });

  it('should handle multiple paths with include patterns', () => {
    expect(
      evaluatePatternCriteria(
        ['dist/main.js', 'src/utils.js'],
        [createMatcher('src')],
        [],
      ),
    ).toBe(true);
  });

  it('should handle multiple paths with exclude patterns', () => {
    expect(
      evaluatePatternCriteria(
        ['src/main.js', 'node_modules/react.js'],
        [],
        [createMatcher('node_modules')],
      ),
    ).toBe(false);
  });

  it('should return false with empty paths array and include patterns', () => {
    expect(evaluatePatternCriteria([], [createMatcher('src')], [])).toBe(false);
  });

  it('should return true with empty paths array and exclude patterns', () => {
    expect(
      evaluatePatternCriteria([], [], [createMatcher('node_modules')]),
    ).toBe(true);
  });

  it('should return true with empty paths array and no patterns', () => {
    expect(evaluatePatternCriteria([], [], [])).toBe(true);
  });
});

describe('getInputPaths', () => {
  it('should return only input file paths', () => {
    expect(
      getInputPaths({
        path: 'dist/bundle.js',
        bytes: 500,
        inputs: {
          'src/main.ts': { bytes: 200 },
          'src/utils.ts': { bytes: 300 },
        },
      }),
    ).toStrictEqual(['src/main.ts', 'src/utils.ts']);
  });

  it('should handle empty inputs object', () => {
    expect(
      getInputPaths({
        path: 'dist/bundle.js',
        bytes: 100,
        inputs: {},
      }),
    ).toStrictEqual([]);
  });

  it('should return empty array when output has no inputs', () => {
    expect(getInputPaths({ path: 'test.js', bytes: 100 })).toStrictEqual([]);
  });
});

describe('getImportPaths', () => {
  it('should return only direct import paths from output', () => {
    expect(
      getImportPaths({
        path: 'dist/bundle.js',
        bytes: 800,
        imports: [
          { path: 'dist/chunks/vendor.js', kind: 'import-statement' },
          { path: 'dist/chunks/utils.js', kind: 'import-statement' },
        ],
      }),
    ).toStrictEqual(['dist/chunks/vendor.js', 'dist/chunks/utils.js']);
  });

  it('should return empty array when output has no imports', () => {
    expect(
      getImportPaths({
        path: 'dist/bundle.js',
        bytes: 500,
        inputs: {
          'src/main.ts': { bytes: 200 },
          'src/utils.ts': { bytes: 300 },
        },
      }),
    ).toStrictEqual([]);
  });

  it('should return empty array when imports is undefined', () => {
    expect(
      getImportPaths({
        path: 'dist/bundle.js',
        bytes: 100,
      }),
    ).toStrictEqual([]);
  });
});

describe('inputsMatchPatterns', () => {
  it('should return true when no include or exclude input patterns are provided', () => {
    expect(
      inputsMatchPatterns(
        {
          path: 'dist/bundle.js',
          bytes: 400,
          inputs: {
            'src/main.ts': { bytes: 400 },
          },
        },
        [],
        [],
      ),
    ).toBe(true);
  });

  it('should evaluate patterns against input paths when patterns are provided', () => {
    const includePatterns = [vi.fn().mockReturnValue(true)];
    const excludePatterns = [vi.fn().mockReturnValue(false)];

    const result = inputsMatchPatterns(
      {
        path: 'dist/bundle.js',
        bytes: 400,
        inputs: {
          'src/main.ts': { bytes: 400 },
        },
      },
      includePatterns,
      excludePatterns,
    );

    expect(result).toBe(true);
    expect(includePatterns[0]).toHaveBeenCalledWith('src/main.ts');
  });

  it('should handle bundles with no inputs', () => {
    expect(
      inputsMatchPatterns(
        {
          path: 'dist/bundle.js',
          bytes: 400,
        },
        [vi.fn().mockReturnValue(true)],
        [],
      ),
    ).toBe(false);
  });
});

describe('importsMatchPatterns', () => {
  it('should return true when no include or exclude import patterns are provided', () => {
    expect(
      importsMatchPatterns(
        {
          path: 'dist/bundle.js',
          bytes: 400,
          imports: [
            { path: 'node_modules/react/index.js', kind: 'import-statement' },
          ],
        },
        [],
        [],
      ),
    ).toBe(true);
  });

  it('should evaluate patterns against import paths when patterns are provided', () => {
    const includePatterns = [vi.fn().mockReturnValue(true)];
    const excludePatterns = [vi.fn().mockReturnValue(false)];

    const result = importsMatchPatterns(
      {
        path: 'dist/bundle.js',
        bytes: 400,
        imports: [
          { path: 'node_modules/react/index.js', kind: 'import-statement' },
        ],
      },
      includePatterns,
      excludePatterns,
    );

    expect(result).toBe(true);
    expect(includePatterns[0]).toHaveBeenCalledWith(
      'node_modules/react/index.js',
    );
  });

  it('should handle bundles with no imports', () => {
    expect(
      importsMatchPatterns(
        {
          path: 'dist/bundle.js',
          bytes: 400,
        },
        [vi.fn().mockReturnValue(true)],
        [],
      ),
    ).toBe(false);
  });
});

describe('isBundleSelected', () => {
  const createCompiledPatterns = (
    overrides: Partial<CompiledPatterns> = {},
  ): CompiledPatterns => {
    const base: CompiledPatterns = {
      includeOutputs: [],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
    };
    return { ...base, ...overrides };
  };

  it('should return false when no include patterns are provided in feature mode', () => {
    expect(
      isBundleSelected(
        {
          path: 'dist/main.js',
          bytes: 400,
        },
        createCompiledPatterns(),
        'feature',
      ),
    ).toBe(false);
  });

  it('should return true when output path matches pattern', () => {
    const includeOutputsMock = vi.fn().mockReturnValue(true);

    const result = isBundleSelected(
      {
        path: 'main.js',
        bytes: 400,
      },
      createCompiledPatterns({
        includeOutputs: [includeOutputsMock],
      }),
    );

    expect(result).toBe(true);
    expect(includeOutputsMock).toHaveBeenCalledWith('main.js');
  });

  it('should return false when output patterns fail', () => {
    const includeOutputsMock = vi.fn().mockReturnValue(false);

    const result = isBundleSelected(
      {
        path: 'dist/main.js',
        bytes: 400,
      },
      createCompiledPatterns({
        includeOutputs: [includeOutputsMock],
      }),
    );

    expect(result).toBe(false);
    expect(includeOutputsMock).toHaveBeenCalled();
  });

  it('should return true when all criteria match', () => {
    const result = isBundleSelected(
      {
        path: 'dist/main.js',
        bytes: 400,
        inputs: {
          'src/main.ts': { bytes: 400 },
        },
      },
      createCompiledPatterns({
        includeOutputs: [vi.fn().mockReturnValue(true)],
        includeInputs: [vi.fn().mockReturnValue(true)],
      }),
    );

    expect(result).toBe(true);
  });
});

describe('compilePattern', () => {
  it('should compile glob pattern and return matcher function', () => {
    const matcher = compilePattern('src/**/*.js', {
      normalizeRelativePaths: true,
    });
    expect(typeof matcher).toBe('function');
  });

  it.each([
    ['src/**/*.js', 'src/main.js'],
    ['*.ts', 'main.ts'],
    ['!node_modules/**', 'src/main.js'],
  ])('should match: compilePattern(%s)(%s)', (pattern, path) => {
    expect(
      compilePattern(pattern, { normalizeRelativePaths: true })(path),
    ).toBe(true);
  });

  it.each([
    ['src/**/*.js', 'dist/main.js'],
    ['*.ts', 'main.js'],
    ['*.ts', 'src/main.ts'],
    ['!node_modules/**', 'node_modules/react/index.js'],
  ])('should not match: compilePattern(%s)(%s)', (pattern, path) => {
    expect(
      compilePattern(pattern, { normalizeRelativePaths: true })(path),
    ).toBe(false);
  });

  it('should create equivalent matchers for same pattern', () => {
    const matcher1 = compilePattern('src/**', {
      normalizeRelativePaths: true,
    });
    const matcher2 = compilePattern('src/**', {
      normalizeRelativePaths: true,
    });

    // Both matchers should work the same way
    expect(matcher1('src/main.js')).toBe(matcher2('src/main.js'));
    expect(matcher1('dist/main.js')).toBe(matcher2('dist/main.js'));
  });
});

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

    const compiled = result.includeOutputs[0]!;
    expect(compiled('dist/main.js')).toBe(true);
    expect(compiled('dist/main.map')).toBe(false);
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

  it('should merge global include/exclude patterns into all specific selection types', () => {
    const selectionOptions = {
      include: ['src/**'],
      exclude: ['*.test.*'],
      includeOutputs: ['main.js'],
      excludeOutputs: ['dev.js'],
      includeInputs: ['components/**'],
      excludeInputs: ['temp.js'],
    };
    const normalizedConfig = normalizeSelectionOptions(selectionOptions);
    const result = compileSelectionPatterns(normalizedConfig);

    // Verify that global patterns are merged with specific patterns
    expect(result.includeOutputs).toHaveLength(2); // main.js + src/**
    expect(result.excludeOutputs).toHaveLength(2); // dev.js + *.test.*
    expect(result.includeInputs).toHaveLength(2); // components/** + src/**
    expect(result.excludeInputs).toHaveLength(2); // temp.js + *.test.*
  });

  it('should work with new PascalCase type configurations', () => {
    const outputConfig = {
      mode: 'bundle' as const,
      includeOutputs: ['*.js'],
      excludeOutputs: ['*.test.js'],
      includeInputs: [],
      excludeInputs: [],
    };

    const result = compileSelectionPatterns(outputConfig);

    expect(result.includeOutputs).toHaveLength(1);
    expect(result.excludeOutputs).toHaveLength(1);
    expect(result.includeOutputs[0]!('main.js')).toBe(true);
    expect(result.excludeOutputs[0]!('main.test.js')).toBe(true);
  });
});

describe('selectBundles', () => {
  const emptyPatterns = {
    mode: 'bundle' as const,
    includeOutputs: [],
    excludeOutputs: [],
    includeInputs: [],
    excludeInputs: [],
  };

  it('should return empty result for empty unified stats with valid patterns', () => {
    expect(
      selectBundles(
        {},
        {
          ...emptyPatterns,
          includeOutputs: ['*.js'],
        },
      ),
    ).toStrictEqual({});
  });

  it('should include outputs matching includeOutputs patterns', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
      },
      'dist/features/auth.js': {
        path: 'dist/features/auth.js',
      },
    } as unknown as UnifiedStats;
    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeOutputs: ['dist/main.js'],
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'],
    });
  });

  it('should include static import dependencies that contribute to bundle size', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        imports: [{ path: 'dist/vendor.js', kind: 'import-statement' }],
      },
      'dist/vendor.js': {
        path: 'dist/vendor.js',
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeOutputs: ['dist/main.js'],
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'],
      'dist/vendor.js': stats['dist/vendor.js'],
    });
  });

  it('should include static import dependencies even when they match exclude patterns', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        inputs: {
          'src/main.ts': {},
        },
        imports: [
          { path: 'dist/chunks/vendor-ABC123.js', kind: 'import-statement' }, // Static import - contributes to bundle size
          { path: 'dist/chunks/feature-DEF456.js', kind: 'dynamic-import' }, // Dynamic import - doesn't contribute
        ],
      },
      'dist/chunks/vendor-ABC123.js': {
        path: 'dist/chunks/vendor-ABC123.js',
        inputs: {
          'node_modules/react/index.js': {},
          'node_modules/react-dom/index.js': {},
        },
      },
      'dist/chunks/feature-DEF456.js': {
        path: 'dist/chunks/feature-DEF456.js',
        inputs: {
          'src/features/auth.ts': {},
          'src/features/profile.ts': {},
        },
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeOutputs: ['dist/main.js'],
        excludeOutputs: ['**/chunks/**'],
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'],
      'dist/chunks/vendor-ABC123.js': stats['dist/chunks/vendor-ABC123.js'],
    });
  });

  it('should exclude dynamic imports that do not contribute to bundle size', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        imports: [{ path: 'dist/lazy-feature.js', kind: 'dynamic-import' }],
      },
      'dist/lazy-feature.js': {
        path: 'dist/lazy-feature.js',
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeOutputs: ['dist/main.js'],
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'],
    });
  });

  it('should include outputs with matching includeInputs patterns', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        inputs: {
          'src/main.ts': {},
        },
      },
      'dist/vendor.js': {
        path: 'dist/vendor.js',
        inputs: {
          'node_modules/react.js': {},
        },
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeInputs: ['src/**'],
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'],
    });
  });

  it('should exclude outputs with matching excludeInputs patterns', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        inputs: {
          'src/main.ts': {},
        },
      },
      'dist/test.js': {
        path: 'dist/test.js',
        inputs: {
          'src/test.spec.ts': {},
        },
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeOutputs: ['dist/*.js'],
        excludeInputs: ['**/*.spec.ts'],
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'],
    });
  });

  it('should apply mode: bundle', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        bytes: 1000,
        inputs: {
          'src/main.ts': { bytes: 500 },
          'src/utils.ts': { bytes: 500 },
        },
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        mode: 'bundle',
        includeOutputs: ['dist/*.js'],
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'],
    });
  });

  it('should apply mode: feature', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        bytes: 1000,
        inputs: {
          'src/main.ts': { bytes: 300 },
          'src/feature.ts': { bytes: 200 },
          'src/other.ts': { bytes: 500 },
        },
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        mode: 'feature',
        includeInputs: ['**/*feature*'],
      }),
    ).toStrictEqual({
      'dist/main.js': {
        ...stats['dist/main.js'],
        inputs: { 'src/feature.ts': { bytes: 200 } },
        bytes: 200,
      },
    });
  });

  it('should apply mode: startup', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        bytes: 500,
        imports: [{ path: 'dist/vendor.js', kind: 'import-statement' }],
      },
      'dist/vendor.js': {
        path: 'dist/vendor.js',
        bytes: 300,
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        mode: 'startup',
        includeOutputs: ['dist/main.js'],
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'],
      'dist/vendor.js': stats['dist/vendor.js'],
    });
  });

  it('should apply mode: dependencies', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        bytes: 500,
        imports: [
          { path: 'dist/vendor.js', kind: 'import-statement' },
          { path: 'dist/lazy.js', kind: 'dynamic-import' },
        ],
      },
      'dist/vendor.js': {
        path: 'dist/vendor.js',
        bytes: 300,
      },
      'dist/lazy.js': {
        path: 'dist/lazy.js',
        bytes: 100,
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        mode: 'dependencies',
        includeOutputs: ['dist/main.js'],
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'],
      'dist/vendor.js': stats['dist/vendor.js'],
      'dist/lazy.js': stats['dist/lazy.js'],
    });
  });

  it('should throw descriptive error for empty selection options', () => {
    expect(() => selectBundles({}, emptyPatterns)).toThrow(
      'Selection requires at least one include/exclude pattern for outputs or inputs',
    );
    expect(() =>
      selectBundles(
        {
          'main.js': {
            path: 'dist/main.js',
            bytes: 0,
            inputs: {},
          },
          'bin.js': {
            path: 'dist/bin.js',
            bytes: 0,
            inputs: {},
          },
        },
        emptyPatterns,
      ),
    ).toThrow(
      'Selection requires at least one include/exclude pattern for outputs or inputs',
    );
  });

  it('should throw error with helpful examples', () => {
    expect(() => selectBundles({}, emptyPatterns)).toThrow(
      'Provide patterns like: { includeOutputs: ["*.js"] } or { includeInputs: ["src/**"] }',
    );
  });

  it('should select only matching outputs when include patterns are specified', () => {
    const stats = {
      'dist/main.js': { path: 'dist/main.js' },
      'dist/admin.js': { path: 'dist/admin.js' },
      'dist/test.js': { path: 'dist/test.js' },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeOutputs: ['**/main.js'], // Only main.js should be selected
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'], // Others excluded by include-first logic
    });
  });

  it('should match any pattern in include arrays (OR logic within arrays)', () => {
    const stats = {
      'dist/main.js': { path: 'dist/main.js' },
      'dist/vendor.js': { path: 'dist/vendor.js' },
      'dist/admin.js': { path: 'dist/admin.js' },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeOutputs: ['**/main.js', '**/vendor.js'], // OR logic - should match both
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'],
      'dist/vendor.js': stats['dist/vendor.js'],
    });
  });
});
