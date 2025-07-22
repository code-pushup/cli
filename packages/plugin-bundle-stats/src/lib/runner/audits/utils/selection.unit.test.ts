import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SelectionOptions } from '../../types.js';
import type {
  UnifiedStats,
  UnifiedStatsBundle,
} from '../unify/unified-stats.types.js';
import { compilePattern as sharedCompilePattern } from './details/utils/match-pattern.js';
import {
  type IncludeEntryPoints,
  type IncludeImports,
  type IncludeInputs,
  type IncludeOutputs,
  type SelectionConfig,
  clearSelectionCaches,
  compileSelectionPatterns,
  getImportPaths,
  getInputPaths,
  importsMatchPatterns,
  inputsMatchPatterns,
  isBundleSelected,
  normalizeSelectionOptions,
  pathsMatch,
  selectBundles,
} from './selection.js';

const emptyPatterns: Required<SelectionOptions> = {
  include: [],
  exclude: [],
  includeOutputs: [],
  excludeOutputs: [],
  includeInputs: [],
  excludeInputs: [],
  includeImports: [],
  excludeImports: [],
  includeEntryPoints: [],
  excludeEntryPoints: [],
};

// =============================================================================
// TYPE TESTING
// =============================================================================

describe('Type Definitions', () => {
  it('should support new PascalCase types', () => {
    // Test that new PascalCase types work correctly
    const outputConfig: IncludeOutputs = {
      includeOutputs: ['*.js'],
      excludeOutputs: ['*.test.js'],
    };

    const inputConfig: IncludeInputs = {
      includeInputs: ['src/**'],
      excludeInputs: ['**/*.test.*'],
    };

    const importConfig: IncludeImports = {
      includeImports: ['node_modules/**'],
      excludeImports: ['node_modules/dev-*/**'],
    };

    const entryPointConfig: IncludeEntryPoints = {
      includeEntryPoints: ['main.js'],
      excludeEntryPoints: ['dev.js'],
    };

    expect(outputConfig.includeOutputs).toEqual(['*.js']);
    expect(inputConfig.includeInputs).toEqual(['src/**']);
    expect(importConfig.includeImports).toEqual(['node_modules/**']);
    expect(entryPointConfig.includeEntryPoints).toEqual(['main.js']);
  });

  it('should ensure SelectionConfig has required arrays', () => {
    const config: SelectionConfig = {
      includeOutputs: ['*.js'],
      excludeOutputs: [],
      includeInputs: ['src/**'],
      excludeInputs: [],
      includeImports: [],
      excludeImports: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    };

    // All properties should be arrays, not optional
    expect(Array.isArray(config.includeOutputs)).toBe(true);
    expect(Array.isArray(config.excludeOutputs)).toBe(true);
  });
});

// =============================================================================
// CORE PATTERN MATCHING TESTS
// =============================================================================

describe('pathsMatch', () => {
  const createMatcher = (pattern: string) => (path: string) =>
    path.includes(pattern);

  it('should return true when no include or exclude patterns are provided', () => {
    expect(pathsMatch(['src/main.js'], [], [])).toBe(true);
  });

  it('should return true when paths match include patterns', () => {
    expect(pathsMatch(['src/main.js'], [createMatcher('src')], [])).toBe(true);
  });

  it('should return false when no paths match include patterns', () => {
    expect(pathsMatch(['dist/main.js'], [createMatcher('src')], [])).toBe(
      false,
    );
  });

  it('should return false when paths match exclude patterns', () => {
    expect(
      pathsMatch(
        ['node_modules/react.js'],
        [],
        [createMatcher('node_modules')],
      ),
    ).toBe(false);
  });

  it('should return true when no paths match exclude patterns', () => {
    expect(
      pathsMatch(['src/main.js'], [], [createMatcher('node_modules')]),
    ).toBe(true);
  });

  it('should return true when paths match include but not exclude patterns', () => {
    expect(
      pathsMatch(
        ['src/main.js'],
        [createMatcher('src')],
        [createMatcher('test')],
      ),
    ).toBe(true);
  });

  it('should return false when paths match both include and exclude patterns', () => {
    expect(
      pathsMatch(
        ['src/test/main.js'],
        [createMatcher('src')],
        [createMatcher('test')],
      ),
    ).toBe(false);
  });

  it('should return false when paths match exclude even if they match include', () => {
    expect(
      pathsMatch(
        ['main.backup.js'],
        [createMatcher('main')],
        [createMatcher('backup')],
      ),
    ).toBe(false);
  });

  it('should handle multiple paths with include patterns', () => {
    expect(
      pathsMatch(['dist/main.js', 'src/utils.js'], [createMatcher('src')], []),
    ).toBe(true);
  });

  it('should handle multiple paths with exclude patterns', () => {
    expect(
      pathsMatch(
        ['src/main.js', 'node_modules/react.js'],
        [],
        [createMatcher('node_modules')],
      ),
    ).toBe(false);
  });

  it('should return false with empty paths array and include patterns', () => {
    expect(pathsMatch([], [createMatcher('src')], [])).toBe(false);
  });

  it('should return true with empty paths array and exclude patterns', () => {
    expect(pathsMatch([], [], [createMatcher('node_modules')])).toBe(true);
  });

  it('should return true with empty paths array and no patterns', () => {
    expect(pathsMatch([], [], [])).toBe(true);
  });
});

// =============================================================================
// PATH EXTRACTION TESTS
// =============================================================================

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

// =============================================================================
// PATTERN MATCHING TESTS
// =============================================================================

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
  // Helper to create proper compiled patterns for testing
  const createCompiledPatterns = (
    overrides: Partial<Record<keyof SelectionOptions, any>> = {},
  ) => {
    const base = {
      includeOutputs: [],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
      includeImports: [],
      excludeImports: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    };
    return { ...base, ...overrides };
  };

  it('should return false when no entryPoint but includeEntryPoints has patterns', () => {
    expect(
      isBundleSelected(
        {
          path: 'dist/main.js',
          bytes: 400,
        },
        createCompiledPatterns({
          includeEntryPoints: [vi.fn().mockReturnValue(true)],
        }),
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
        entryPoint: 'src/main.ts',
        inputs: {
          'src/main.ts': { bytes: 400 },
        },
        imports: [
          { path: 'node_modules/react/index.js', kind: 'import-statement' },
        ],
      },
      createCompiledPatterns({
        includeOutputs: [vi.fn().mockReturnValue(true)],
        includeInputs: [vi.fn().mockReturnValue(true)],
        includeImports: [vi.fn().mockReturnValue(true)],
        includeEntryPoints: [vi.fn().mockReturnValue(true)],
      }),
    );

    expect(result).toBe(true);
  });
});

// =============================================================================
// PATTERN COMPILATION TESTS
// =============================================================================

describe('sharedCompilePattern', () => {
  beforeEach(() => {
    clearSelectionCaches();
  });

  it('should compile glob pattern and return matcher function', () => {
    const matcher = sharedCompilePattern('src/**/*.js', {
      normalizeRelativePaths: true,
    });
    expect(typeof matcher).toBe('function');
  });

  it.each([
    ['src/**/*.js', 'src/main.js'],
    ['*.ts', 'main.ts'],
    ['!node_modules/**', 'src/main.js'],
  ])('should match: sharedCompilePattern(%s)(%s)', (pattern, path) => {
    expect(
      sharedCompilePattern(pattern, { normalizeRelativePaths: true })(path),
    ).toBe(true);
  });

  it.each([
    ['src/**/*.js', 'dist/main.js'],
    ['*.ts', 'main.js'],
    ['*.ts', 'src/main.ts'],
    ['!node_modules/**', 'node_modules/react/index.js'],
  ])('should not match: sharedCompilePattern(%s)(%s)', (pattern, path) => {
    expect(
      sharedCompilePattern(pattern, { normalizeRelativePaths: true })(path),
    ).toBe(false);
  });

  it('should return cached matcher for same pattern', () => {
    expect(
      sharedCompilePattern('src/**', { normalizeRelativePaths: true }),
    ).toBe(sharedCompilePattern('src/**', { normalizeRelativePaths: true }));
  });
});

describe('compileSelectionPatterns', () => {
  beforeEach(() => {
    clearSelectionCaches();
  });

  it('should return object with correct structure for all pattern types', () => {
    const result = compileSelectionPatterns({
      includeOutputs: ['dist/**/*.js'],
      excludeOutputs: ['dist/**/*.map'],
      includeInputs: ['src/**/*.ts'],
      excludeInputs: ['**/*.test.ts'],
      includeImports: ['node_modules/**'],
      excludeImports: ['node_modules/dev-*/**'],
      includeEntryPoints: ['main.js'],
      excludeEntryPoints: ['dev.js'],
    });

    expect(result).toStrictEqual({
      includeOutputs: [expect.any(Function)],
      excludeOutputs: [expect.any(Function)],
      includeInputs: [expect.any(Function)],
      excludeInputs: [expect.any(Function)],
      includeImports: [expect.any(Function)],
      excludeImports: [expect.any(Function)],
      includeEntryPoints: [expect.any(Function)],
      excludeEntryPoints: [expect.any(Function)],
    });

    const compiled = result.includeOutputs[0]!;
    expect(compiled('dist/main.js')).toBe(true);
    expect(compiled('dist/main.map')).toBe(false);
  });

  it('should handle empty selection options', () => {
    expect(
      compileSelectionPatterns({
        includeOutputs: [],
        excludeOutputs: [],
        includeInputs: [],
        excludeInputs: [],
        includeImports: [],
        excludeImports: [],
        includeEntryPoints: [],
        excludeEntryPoints: [],
      }),
    ).toStrictEqual({
      includeOutputs: [],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
      includeImports: [],
      excludeImports: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    });
  });

  it('should merge global include/exclude patterns into all specific selection types', () => {
    const result = compileSelectionPatterns({
      include: ['src/**'],
      exclude: ['*.test.*'],
      includeOutputs: ['main.js'],
      excludeOutputs: ['dev.js'],
      includeInputs: ['components/**'],
      excludeInputs: ['temp.js'],
      includeImports: ['node_modules/**'],
      excludeImports: ['node_modules/dev-*/**'],
    });

    // Verify that global patterns are merged with specific patterns
    expect(result.includeOutputs).toHaveLength(2); // main.js + src/**
    expect(result.excludeOutputs).toHaveLength(2); // dev.js + *.test.*
    expect(result.includeInputs).toHaveLength(2); // components/** + src/**
    expect(result.excludeInputs).toHaveLength(2); // temp.js + *.test.*
    expect(result.includeImports).toHaveLength(2); // node_modules/** + src/**
    expect(result.excludeImports).toHaveLength(2); // node_modules/dev-*/** + *.test.*
    expect(result.includeEntryPoints).toHaveLength(1); // only src/**
    expect(result.excludeEntryPoints).toHaveLength(1); // only *.test.*

    // Test that merged patterns work correctly
    expect(result.includeOutputs[0]!('main.js')).toBe(true);
    expect(result.includeOutputs[1]!('src/utils.js')).toBe(true);
    expect(result.excludeOutputs[0]!('dev.js')).toBe(true);
    expect(result.excludeOutputs[1]!('main.test.js')).toBe(true);
  });

  it('should work with new PascalCase type configurations', () => {
    const outputConfig: IncludeOutputs = {
      includeOutputs: ['*.js'],
      excludeOutputs: ['*.test.js'],
    };

    const result = compileSelectionPatterns(outputConfig);

    expect(result.includeOutputs).toHaveLength(1);
    expect(result.excludeOutputs).toHaveLength(1);
    expect(result.includeOutputs[0]!('main.js')).toBe(true);
    expect(result.excludeOutputs[0]!('main.test.js')).toBe(true);
  });
});

// =============================================================================
// MAIN SELECTION LOGIC TESTS
// =============================================================================

describe('selectBundles', () => {
  const emptyPatterns = {
    includeOutputs: [],
    excludeOutputs: [],
    includeInputs: [],
    excludeInputs: [],
    includeImports: [],
    excludeImports: [],
    includeEntryPoints: [],
    excludeEntryPoints: [],
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

  it('should include outputs with matching includeEntryPoints patterns', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        entryPoint: 'src/main.ts',
      },
      'dist/worker.js': {
        path: 'dist/worker.js',
        entryPoint: 'src/worker.ts',
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeEntryPoints: ['src/main.ts'],
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'],
    });
  });

  it('should exclude outputs with matching excludeEntryPoints patterns', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        entryPoint: 'src/main.ts',
      },
      'dist/test.js': {
        path: 'dist/test.js',
        entryPoint: 'src/test.ts',
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeOutputs: ['dist/*.js'],
        excludeEntryPoints: ['**/test.ts'],
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

  it('should include outputs with matching includeImports patterns', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        imports: [{ path: 'node_modules/react.js', kind: 'import-statement' }],
      },
      'dist/vendor.js': {
        path: 'dist/vendor.js',
        imports: [{ path: 'src/utils.js', kind: 'import-statement' }],
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeImports: ['node_modules/**'],
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

  it('should exclude outputs with matching excludeImports patterns', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        imports: [{ path: 'src/utils.js', kind: 'import-statement' }],
      },
      'dist/vendor.js': {
        path: 'dist/vendor.js',
        imports: [{ path: 'node_modules/react.js', kind: 'import-statement' }],
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeOutputs: ['dist/*.js'],
        excludeImports: ['node_modules/**'],
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'],
    });
  });

  it('should exclude outputs when excludeImports matches despite includeInputs matching', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        inputs: {
          'src/main.ts': {},
        },
        imports: [{ path: 'node_modules/react.js', kind: 'import-statement' }],
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeInputs: ['src/**'],
        excludeImports: ['node_modules/**'],
      }),
    ).toStrictEqual({});
  });

  it('should exclude outputs when excludeOutputs matches despite includeImports matching', () => {
    const stats = {
      'dist/main.js': {
        path: 'dist/main.js',
        imports: [{ path: 'node_modules/react.js', kind: 'import-statement' }],
      },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeImports: ['node_modules/**'],
        excludeOutputs: ['dist/main.js'],
      }),
    ).toStrictEqual({});
  });

  it('should throw descriptive error for empty selection options', () => {
    expect(() => selectBundles({}, emptyPatterns)).toThrow(
      'Selection requires at least one include/exclude pattern for outputs, inputs, imports, or entry points',
    );
    expect(() =>
      selectBundles(
        {
          'main.js': {
            path: 'dist/main.js',
            bytes: 0,
            entryPoint: 'src/main.ts',
            inputs: {},
          },
          'bin.js': {
            path: 'dist/bin.js',
            bytes: 0,
            entryPoint: 'src/bin.ts',
            inputs: {},
          },
        },
        emptyPatterns,
      ),
    ).toThrow(
      'Selection requires at least one include/exclude pattern for outputs, inputs, imports, or entry points',
    );
  });

  it('should throw error with helpful examples', () => {
    expect(() => selectBundles({}, emptyPatterns)).toThrow(
      'Provide patterns like: { includeOutputs: ["*.js"] } or { includeInputs: ["src/**"] }',
    );
  });

  it('should ignore entry point patterns for outputs without entryPoint metadata', () => {
    const stats = {
      'dist/main.js': { path: 'dist/main.js' }, // No entryPoint
      'dist/app.js': { path: 'dist/app.js', entryPoint: 'src/app.ts' },
    } as unknown as UnifiedStats;

    expect(
      selectBundles(stats, {
        ...emptyPatterns,
        includeOutputs: ['dist/*.js'],
        excludeEntryPoints: ['src/app.ts'], // Should only affect app.js, not main.js
      }),
    ).toStrictEqual({
      'dist/main.js': stats['dist/main.js'], // Included (no entryPoint to check)
    });
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
