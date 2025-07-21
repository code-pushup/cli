import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SelectionOptions } from '../../types.js';
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

  it('should maintain backward compatibility with lowercase types', () => {
    // Verify that old lowercase types still work (via type aliases)
    const legacySelection: SelectionOptions = {
      includeOutputs: ['*.js'], // This should still work
      includeInputs: ['src/**'],
    };

    expect(legacySelection.includeOutputs).toEqual(['*.js']);
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
// NORMALIZATION TESTS
// =============================================================================

describe('normalizeSelectionOptions', () => {
  it('should merge global include patterns into all specific types', () => {
    const result = normalizeSelectionOptions({
      include: ['src/**', 'lib/**'],
      includeOutputs: ['*.js'],
      includeInputs: ['components/**'],
    });

    expect(result).toStrictEqual({
      includeOutputs: ['*.js', 'src/**', 'lib/**'],
      excludeOutputs: [],
      includeInputs: ['components/**', 'src/**', 'lib/**'],
      excludeInputs: [],
      includeImports: ['src/**', 'lib/**'],
      excludeImports: [],
      includeEntryPoints: ['src/**', 'lib/**'],
      excludeEntryPoints: [],
    });
  });

  it('should merge global exclude patterns into all specific types', () => {
    const result = normalizeSelectionOptions({
      exclude: ['*.test.*', '*.spec.*'],
      excludeOutputs: ['*.map'],
      excludeInputs: ['temp/**'],
      includeOutputs: [], // Required by SelectionOptions type
    });

    expect(result).toStrictEqual({
      includeOutputs: [],
      excludeOutputs: ['*.map', '*.test.*', '*.spec.*'],
      includeInputs: [],
      excludeInputs: ['temp/**', '*.test.*', '*.spec.*'],
      includeImports: [],
      excludeImports: ['*.test.*', '*.spec.*'],
      includeEntryPoints: [],
      excludeEntryPoints: ['*.test.*', '*.spec.*'],
    });
  });

  it('should provide defaults for missing patterns', () => {
    const result = normalizeSelectionOptions({
      includeOutputs: ['*.js'],
    });

    expect(result).toStrictEqual({
      includeOutputs: ['*.js'],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
      includeImports: [],
      excludeImports: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    });
  });

  it('should handle empty selection options', () => {
    // Cast as SelectionOptions to test edge case handling
    const result = normalizeSelectionOptions({
      includeOutputs: [],
    } as SelectionOptions);

    expect(result).toStrictEqual({
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

  it('should merge both global and specific patterns correctly', () => {
    const result = normalizeSelectionOptions({
      include: ['src/**'],
      exclude: ['*.test.*'],
      includeOutputs: ['main.js'],
      excludeOutputs: ['dev.js'],
      includeInputs: ['components/**'],
      excludeInputs: ['temp.js'],
    });

    expect(result).toStrictEqual({
      includeOutputs: ['main.js', 'src/**'],
      excludeOutputs: ['dev.js', '*.test.*'],
      includeInputs: ['components/**', 'src/**'],
      excludeInputs: ['temp.js', '*.test.*'],
      includeImports: ['src/**'],
      excludeImports: ['*.test.*'],
      includeEntryPoints: ['src/**'],
      excludeEntryPoints: ['*.test.*'],
    });
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
// CACHE MANAGEMENT TESTS
// =============================================================================

describe('clearSelectionCaches', () => {
  it('should clear pattern cache', () => {
    // Test pattern cache
    const matcher1 = sharedCompilePattern('src/**/*.js', {
      normalizeRelativePaths: true,
    });
    const matcher2 = sharedCompilePattern('src/**/*.js', {
      normalizeRelativePaths: true,
    });
    expect(matcher1).toBe(matcher2);

    // Clear pattern cache
    clearSelectionCaches();

    // Verify pattern cache is cleared
    const matcher3 = sharedCompilePattern('src/**/*.js', {
      normalizeRelativePaths: true,
    });
    expect(matcher1).not.toBe(matcher3);
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

  it('should select bundles based on include and exclude patterns', () => {
    const detailedStats = {
      'main.js': {
        path: 'dist/main.js',
        bytes: 45000,
        entryPoint: 'src/main.ts',
        inputs: {
          'src/main.ts': { bytes: 2500 },
          'src/utils/helpers.ts': { bytes: 1200 },
          'src/components/Button.tsx': { bytes: 3800 },
          'src/components/Modal.tsx': { bytes: 2200 },
        },
        imports: [{ path: 'dist/chunks/vendor.js', kind: 'import-statement' }],
      },
      'admin.js': {
        path: 'dist/admin.js',
        bytes: 32000,
        entryPoint: 'src/admin/index.ts',
        inputs: {
          'src/admin/index.ts': { bytes: 1800 },
          'src/admin/dashboard.ts': { bytes: 4200 },
          'src/shared/api.ts': { bytes: 2100 },
        },
      },
      'test-utils.js': {
        path: 'dist/test-utils.js',
        bytes: 8500,
        entryPoint: 'src/test/utils.ts',
        inputs: {
          'src/test/utils.ts': { bytes: 1500 },
          'src/test/helpers.ts': { bytes: 900 },
          'src/test/fixtures.ts': { bytes: 1100 },
        },
      },
      'worker.js': {
        path: 'dist/worker.js',
        bytes: 15000,
        entryPoint: 'src/worker/background.ts',
        inputs: {
          'src/worker/background.ts': { bytes: 2200 },
          'src/worker/tasks.ts': { bytes: 1800 },
        },
      },
      'legacy.bundle.js': {
        path: 'dist/legacy.bundle.js',
        bytes: 120000,
        entryPoint: 'src/legacy/main.js',
        inputs: {
          'src/legacy/main.js': { bytes: 5000 },
          'src/legacy/polyfills.js': { bytes: 8000 },
          'vendor/jquery.js': { bytes: 35000 },
        },
      },
    };

    expect(
      selectBundles(detailedStats, {
        includeOutputs: ['dist/*.js'], // Include all JS files in dist/
        excludeOutputs: ['*test*', 'dist/legacy*'], // Exclude test and legacy files
        includeInputs: ['src/**'], // Include all src inputs
        excludeInputs: ['src/legacy/*'], // Exclude legacy src inputs
        includeEntryPoints: ['src/**'], // Include all src entry points
        excludeEntryPoints: ['*/test/*'], // Exclude test entry points
      }),
    ).toStrictEqual({
      'main.js': detailedStats['main.js'],
      'admin.js': detailedStats['admin.js'],
      'worker.js': detailedStats['worker.js'],
    });
  });

  it('should handle empty unified stats', () => {
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

  it('should correctly handle different patterns without cache collisions', () => {
    // Simple test data with 3 files
    const simpleStats = {
      'file1.js': {
        path: 'dist/file1.js',
        bytes: 100,
        entryPoint: 'src/file1.ts',
        inputs: { 'src/file1.ts': { bytes: 50 } },
      },
      'file2.js': {
        path: 'dist/file2.js',
        bytes: 200,
        entryPoint: 'src/file2.ts',
        inputs: { 'src/file2.ts': { bytes: 100 } },
      },
      'file3.js': {
        path: 'dist/file3.js',
        bytes: 300,
        entryPoint: 'src/file3.ts',
        inputs: { 'src/file3.ts': { bytes: 150 } },
      },
    };

    // Test 1: Select specific existing file
    const result1 = selectBundles(simpleStats, {
      includeOutputs: ['dist/file2.js'],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
      includeImports: [],
      excludeImports: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    });

    // Test 2: Select nonexistent file (should return empty)
    const result2 = selectBundles(simpleStats, {
      includeOutputs: ['nonexistent.js'],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
      includeImports: [],
      excludeImports: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    });

    // Should work correctly without cache collisions
    expect(result1).toStrictEqual({
      'file2.js': simpleStats['file2.js'],
    });

    expect(result2).toStrictEqual({});
  });

  it('should work with new type configurations', () => {
    const stats = {
      'main.js': {
        path: 'dist/main.js',
        bytes: 100,
        inputs: { 'src/main.ts': { bytes: 100 } },
      },
    };

    const config: IncludeOutputs & IncludeInputs = {
      includeOutputs: ['dist/*.js'], // Pattern needs to match the actual path
      excludeOutputs: [],
      includeInputs: ['src/**'], // This should match src/main.ts
      excludeInputs: [],
    };

    const result = selectBundles(stats, config);
    expect(result).toStrictEqual(stats);
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe('Edge Cases', () => {
  it('should handle complex pattern combinations', () => {
    const stats = {
      'complex.js': {
        path: 'dist/complex.js',
        bytes: 100,
        entryPoint: 'src/complex.ts',
        inputs: {
          'src/complex.ts': { bytes: 50 },
          'src/shared/utils.ts': { bytes: 50 },
        },
        imports: [
          { path: 'node_modules/lodash/index.js', kind: 'import-statement' },
        ],
      },
    };

    // All criteria must match - using patterns that will actually match the test data
    const result = selectBundles(stats, {
      includeOutputs: ['dist/*.js'], // ✓ matches dist/complex.js
      includeInputs: ['src/**'], // ✓ matches src/complex.ts and src/shared/utils.ts
      includeImports: ['node_modules/**'], // ✓ matches node_modules/lodash/index.js
      includeEntryPoints: ['src/*.ts'], // ✓ matches src/complex.ts
    });

    expect(result).toStrictEqual(stats);
  });

  it('should reject when any criteria fails', () => {
    const stats = {
      'complex.js': {
        path: 'dist/complex.js',
        bytes: 100,
        entryPoint: 'src/complex.ts',
        inputs: { 'src/complex.ts': { bytes: 100 } },
      },
    };

    // Entry point fails
    const result = selectBundles(stats, {
      includeOutputs: ['dist/*.js'], // ✓ matches
      includeInputs: ['src/**'], // ✓ matches
      includeEntryPoints: ['lib/**'], // ✗ fails - doesn't match src/complex.ts
    });

    expect(result).toStrictEqual({});
  });
});
