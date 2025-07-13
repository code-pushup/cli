import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSelectionCaches,
  compilePattern,
  compileSelectionPatterns,
  evaluateInputs,
  evaluateMatchers,
  getInputPaths,
  selectArtefacts,
  shouldSelectOutput,
} from './selection.js';

const emptyPatterns = {
  includeOutputs: [],
  excludeOutputs: [],
  includeInputs: [],
  excludeInputs: [],
  includeEntryPoints: [],
  excludeEntryPoints: [],
};

describe('evaluateMatchers', () => {
  const createMatcher = (pattern: string) => (path: string) =>
    path.includes(pattern);

  it('should return true when no include or exclude patterns are provided', () => {
    expect(evaluateMatchers(['src/main.js'], [], [])).toBe(true);
  });

  it('should return true when paths match include patterns', () => {
    expect(evaluateMatchers(['src/main.js'], [createMatcher('src')], [])).toBe(
      true,
    );
  });

  it('should return false when no paths match include patterns', () => {
    expect(evaluateMatchers(['dist/main.js'], [createMatcher('src')], [])).toBe(
      false,
    );
  });

  it('should return false when paths match exclude patterns', () => {
    expect(
      evaluateMatchers(
        ['node_modules/react.js'],
        [],
        [createMatcher('node_modules')],
      ),
    ).toBe(false);
  });

  it('should return true when no paths match exclude patterns', () => {
    expect(
      evaluateMatchers(['src/main.js'], [], [createMatcher('node_modules')]),
    ).toBe(true);
  });

  it('should return true when paths match include but not exclude patterns', () => {
    expect(
      evaluateMatchers(
        ['src/main.js'],
        [createMatcher('src')],
        [createMatcher('test')],
      ),
    ).toBe(true);
  });

  it('should return false when paths match both include and exclude patterns', () => {
    expect(
      evaluateMatchers(
        ['src/test/main.js'],
        [createMatcher('src')],
        [createMatcher('test')],
      ),
    ).toBe(false);
  });

  it('should return false when paths match exclude even if they match include', () => {
    expect(
      evaluateMatchers(
        ['main.backup.js'],
        [createMatcher('main')],
        [createMatcher('backup')],
      ),
    ).toBe(false);
  });

  it('should handle multiple paths with include patterns', () => {
    expect(
      evaluateMatchers(
        ['dist/main.js', 'src/utils.js'],
        [createMatcher('src')],
        [],
      ),
    ).toBe(true);
  });

  it('should handle multiple paths with exclude patterns', () => {
    expect(
      evaluateMatchers(
        ['src/main.js', 'node_modules/react.js'],
        [],
        [createMatcher('node_modules')],
      ),
    ).toBe(false);
  });

  it('should return false with empty paths array and include patterns', () => {
    expect(evaluateMatchers([], [createMatcher('src')], [])).toBe(false);
  });

  it('should return true with empty paths array and exclude patterns', () => {
    expect(evaluateMatchers([], [], [createMatcher('node_modules')])).toBe(
      true,
    );
  });

  it('should return true with empty paths array and no patterns', () => {
    expect(evaluateMatchers([], [], [])).toBe(true);
  });
});

describe('getInputPaths', () => {
  beforeEach(() => {
    clearSelectionCaches();
  });

  it('should handle inputs with no imports', () => {
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

  it('should return an empty array when the output has no inputs', () => {
    expect(getInputPaths({ path: 'test.js', bytes: 100 })).toStrictEqual([]);
  });

  it('should collect input paths when output has inputs', () => {
    expect(
      getInputPaths({
        path: 'dist/bundle.js',
        bytes: 800,
        inputs: {
          'src/main.ts': { bytes: 400 },
          'src/components/Header.tsx': { bytes: 200 },
          'src/utils/format.ts': { bytes: 200 },
        },
      }),
    ).toStrictEqual([
      'src/main.ts',
      'src/components/Header.tsx',
      'src/utils/format.ts',
    ]);
  });

  it('should collect direct imports from output', () => {
    expect(
      getInputPaths({
        path: 'dist/bundle.js',
        bytes: 300,
        inputs: {},
        imports: [
          { path: 'dist/chunks/vendor.js', kind: 'import-statement' },
          { path: 'dist/chunks/utils.js', kind: 'import-statement' },
        ],
      }),
    ).toStrictEqual(['dist/chunks/vendor.js', 'dist/chunks/utils.js']);
  });

  it('should return cached result on second call', () => {
    const output = {
      path: 'dist/bundle.js',
      bytes: 400,
      inputs: {
        'src/main.ts': { bytes: 400 },
      },
    };
    expect(getInputPaths(output)).toBe(getInputPaths(output));
  });

  it('should handle inputs correctly', () => {
    expect(
      getInputPaths({
        path: 'dist/bundle.js',
        bytes: 1000,
        inputs: {
          'src/main.ts': {
            bytes: 300,
            imports: [
              { path: 'node_modules/react/index.js', kind: 'import-statement' },
            ],
          },
          'src/utils.ts': { bytes: 200 },
        },
        imports: [{ path: 'dist/chunks/shared.js', kind: 'import-statement' }],
      }),
    ).toStrictEqual([
      'src/main.ts',
      'node_modules/react/index.js',
      'src/utils.ts',
      'dist/chunks/shared.js',
    ]);
  });
});

describe('evaluateInputs', () => {
  it('should return true when no include or exclude input patterns are provided', () => {
    expect(
      evaluateInputs(
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

    const result = evaluateInputs(
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
});

describe('shouldSelectOutput', () => {
  it('should return false when no entryPoint but includeEntryPoints has patterns', () => {
    expect(
      shouldSelectOutput(
        'main.js',
        {
          path: 'dist/main.js',
          bytes: 400,
        },
        {
          includeEntryPoints: [vi.fn().mockReturnValue(true)],
          excludeEntryPoints: [],
          includeOutputs: [],
          excludeOutputs: [],
          includeInputs: [],
          excludeInputs: [],
        },
      ),
    ).toBe(false);
  });

  it('should return true when output path matches pattern', () => {
    const includeOutputsMock = vi.fn().mockReturnValue(true);

    const result = shouldSelectOutput(
      'main.js',
      {
        path: 'main.js',
        bytes: 400,
      },
      {
        includeEntryPoints: [],
        excludeEntryPoints: [],
        includeOutputs: [includeOutputsMock],
        excludeOutputs: [],
        includeInputs: [],
        excludeInputs: [],
      },
    );

    expect(result).toBe(true);
    expect(includeOutputsMock).toHaveBeenCalledWith('main.js');
  });

  it('should return false when output patterns fail', () => {
    const includeOutputsMock = vi.fn().mockReturnValue(false);

    const result = shouldSelectOutput(
      'main.js',
      {
        path: 'dist/main.js',
        bytes: 400,
      },
      {
        includeEntryPoints: [],
        excludeEntryPoints: [],
        includeOutputs: [includeOutputsMock],
        excludeOutputs: [],
        includeInputs: [],
        excludeInputs: [],
      },
    );

    expect(result).toBe(false);
    expect(includeOutputsMock).toHaveBeenCalled();
  });
});

describe('compilePattern', () => {
  beforeEach(() => {
    clearSelectionCaches();
  });

  it('should compile glob pattern and return matcher function', () => {
    const matcher = compilePattern('src/**/*.js');
    expect(typeof matcher).toBe('function');
  });

  it.each([
    ['src/**/*.js', 'src/main.js'],
    ['*.ts', 'main.ts'],
    ['!node_modules/**', 'src/main.js'],
  ])('should match: compilePattern(%s)(%s)', (pattern, path) => {
    expect(compilePattern(pattern)(path)).toBe(true);
  });

  it.each([
    ['src/**/*.js', 'dist/main.js'],
    ['*.ts', 'main.js'],
    ['*.ts', 'src/main.ts'],
    ['!node_modules/**', 'node_modules/react/index.js'],
  ])('should not match: compilePattern(%s)(%s)', (pattern, path) => {
    expect(compilePattern(pattern)(path)).toBe(false);
  });
  it('should return cached matcher for same pattern', () => {
    expect(compilePattern('src/**')).toBe(compilePattern('src/**'));
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
      includeEntryPoints: ['main.js'],
      excludeEntryPoints: ['dev.js'],
    });

    expect(result).toStrictEqual({
      includeOutputs: [expect.any(Function)],
      excludeOutputs: [expect.any(Function)],
      includeInputs: [expect.any(Function)],
      excludeInputs: [expect.any(Function)],
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
        includeEntryPoints: [],
        excludeEntryPoints: [],
      }),
    ).toStrictEqual({
      includeOutputs: [],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    });
  });
});

describe('clearSelectionCaches', () => {
  it('should clear all caches', () => {
    // Test pattern cache
    const matcher1 = compilePattern('src/**/*.js');
    const matcher2 = compilePattern('src/**/*.js');
    expect(matcher1).toBe(matcher2);

    // Test input paths cache
    const output = {
      path: 'dist/bundle.js',
      bytes: 400,
      inputs: {
        'src/main.ts': { bytes: 400 },
      },
    };

    const paths1 = getInputPaths(output);
    const paths2 = getInputPaths(output);
    expect(paths1).toBe(paths2);

    // Clear all caches
    clearSelectionCaches();

    // Verify pattern cache is cleared
    const matcher3 = compilePattern('src/**/*.js');
    expect(matcher1).not.toBe(matcher3);

    // Verify input paths cache is cleared
    const paths3 = getInputPaths(output);
    expect(paths1).not.toBe(paths3);
  });
});

describe('selectArtefacts', () => {
  const emptyPatterns = {
    includeOutputs: [],
    excludeOutputs: [],
    includeInputs: [],
    excludeInputs: [],
    includeEntryPoints: [],
    excludeEntryPoints: [],
  };
  beforeEach(() => {
    clearSelectionCaches();
  });

  it('should select artefacts based on include and exclude patterns', () => {
    const detailedStats = {
      'main.js': {
        path: 'dist/main.js',
        bytes: 45000,
        entryPoint: 'src/main.ts',
        inputs: {
          'src/main.ts': {
            bytes: 2500,
            imports: [
              { path: 'src/utils/helpers.ts', kind: 'import-statement' },
              { path: 'src/components/Button.tsx', kind: 'import-statement' },
              { path: 'src/components/Modal.tsx', kind: 'dynamic-import' },
            ],
          },
          'src/utils/helpers.ts': { bytes: 1200 },
          'src/components/Button.tsx': {
            bytes: 3800,
            imports: [
              { path: 'node_modules/react/index.js', kind: 'import-statement' },
            ],
          },
          'src/components/Modal.tsx': {
            bytes: 2200,
            imports: [
              { path: 'node_modules/react/index.js', kind: 'import-statement' },
            ],
          },
        },
        imports: [{ path: 'dist/chunks/vendor.js', kind: 'import-statement' }],
      },
      'admin.js': {
        path: 'dist/admin.js',
        bytes: 32000,
        entryPoint: 'src/admin/index.ts',
        inputs: {
          'src/admin/index.ts': {
            bytes: 1800,
            imports: [
              { path: 'src/admin/dashboard.ts', kind: 'dynamic-import' },
            ],
          },
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
          'src/worker/background.ts': {
            bytes: 2200,
            imports: [{ path: 'src/worker/tasks.ts', kind: 'dynamic-import' }],
          },
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
      selectArtefacts(detailedStats, {
        includeOutputs: ['*.js'], // Include all JS files
        excludeOutputs: ['*test*', 'legacy*'], // Exclude test and legacy files
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
      selectArtefacts(
        {},
        {
          ...emptyPatterns,
          includeOutputs: ['*.js'],
        },
      ),
    ).toStrictEqual({});
  });

  it('should handle empty selection options by returning an empty object', () => {
    expect(
      selectArtefacts(
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
    ).toStrictEqual({
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
    });
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
    const result1 = selectArtefacts(simpleStats, {
      includeOutputs: ['dist/file2.js'],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    });

    // Test 2: Select nonexistent file (should return empty)
    const result2 = selectArtefacts(simpleStats, {
      includeOutputs: ['nonexistent.js'],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    });

    // Should work correctly without cache collisions
    expect(result1).toStrictEqual({
      'file2.js': simpleStats['file2.js'],
    });

    expect(result2).toStrictEqual({});
  });
});
