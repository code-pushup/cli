import type { SelectionOptions } from '../../../types.js';
import type {
  UnifiedStats,
  UnifiedStatsBundle,
  UnifiedStatsImport,
} from '../../unify/unified-stats.types.js';
import {
  type PatternMatcher,
  clearPatternCache as clearSelectionCaches,
  compilePatterns,
  evaluatePathsWithIncludeExclude,
  compilePattern as sharedCompilePattern,
} from '../details/utils/match-pattern.js';

/**
 * Generic pattern configuration for include/exclude functionality.
 * Reduces type repetition across different pattern types.
 */
type PatternConfig<TInclude extends string, TExclude extends string> = {
  [K in TInclude]: string[];
} & {
  [K in TExclude]: string[];
};

export type Include = {
  include: string[];
  exclude: string[];
};

export type IncludeOutputs = PatternConfig<'includeOutputs', 'excludeOutputs'>;
export type IncludeInputs = PatternConfig<'includeInputs', 'excludeInputs'>;
export type IncludeImports = PatternConfig<'includeImports', 'excludeImports'>;
export type IncludeEntryPoints = PatternConfig<
  'includeEntryPoints',
  'excludeEntryPoints'
>;

export type SelectionConfig = {
  includeOutputs: string[];
  excludeOutputs: string[];
  includeInputs: string[];
  excludeInputs: string[];
  includeImports: string[];
  excludeImports: string[];
  includeEntryPoints: string[];
  excludeEntryPoints: string[];
};

export type CompiledPatterns = Record<keyof SelectionConfig, PatternMatcher[]>;

/**
 * Helper function to evaluate pattern criteria. Reduces repetition in selection logic.
 * Enables cleaner conditional checks by abstracting pattern matching calls.
 */
export function evaluatePatternCriteria(
  paths: string[],
  includePatterns: PatternMatcher[],
  excludePatterns: PatternMatcher[],
): boolean {
  if (includePatterns.length === 0 && excludePatterns.length === 0) {
    return true;
  }
  return evaluatePathsWithIncludeExclude(
    paths,
    includePatterns,
    excludePatterns,
  );
}

/**
 * Validates that selection patterns contain at least one pattern. Prevents empty selection.
 * Ensures users provide meaningful filtering criteria before processing bundles.
 *
 * @throws {Error} When no selection patterns are provided
 */
export function validateSelectionPatterns(patterns: CompiledPatterns): void {
  const hasAnyPatterns = Object.values(patterns).some(
    patternArray => patternArray.length > 0,
  );

  if (!hasAnyPatterns) {
    throw new Error(
      'Selection requires at least one include/exclude pattern for outputs, inputs, imports, or entry points. ' +
        'Provide patterns like: { includeOutputs: ["*.js"] } or { includeInputs: ["src/**"] }',
    );
  }
}

/**
 * Generic helper for evaluating patterns against extracted paths.
 * Reduces code duplication between input and import pattern matching.
 */
export function evaluateBundlePatterns(
  output: UnifiedStatsBundle,
  includePatterns: PatternMatcher[],
  excludePatterns: PatternMatcher[],
  pathExtractor: (output: UnifiedStatsBundle) => string[],
): boolean {
  if (includePatterns.length === 0 && excludePatterns.length === 0) {
    return true;
  }

  const paths = pathExtractor(output);
  return evaluatePathsWithIncludeExclude(
    paths,
    includePatterns,
    excludePatterns,
  );
}

/**
 * Collects input file paths from bundle output. Returns only direct input files.
 * Excludes imported dependencies for precise input-only filtering.
 */
export function getInputPaths(output: UnifiedStatsBundle): string[] {
  return output.inputs ? Object.keys(output.inputs) : [];
}

/**
 * Collects import dependency paths from bundle output. Returns only imported files.
 * Excludes direct input files for precise import-only filtering.
 */
export function getImportPaths(output: UnifiedStatsBundle): string[] {
  return output.imports
    ? output.imports.map((imp: UnifiedStatsImport) => imp.path)
    : [];
}

/**
 * Evaluates input patterns against bundle's input files. Filters based on direct inputs only.
 * Determines if bundle should be included based on its actual input file paths.
 *
 * @param output - Bundle output containing inputs to evaluate
 * @param includePatterns - Compiled patterns that paths must match (empty means allow all)
 * @param excludePatterns - Compiled patterns that paths must not match (empty means exclude none)
 * @returns True if bundle should be included based on input pattern evaluation
 */
export function inputsMatchPatterns(
  output: UnifiedStatsBundle,
  includePatterns: PatternMatcher[],
  excludePatterns: PatternMatcher[],
): boolean {
  return evaluateBundlePatterns(
    output,
    includePatterns,
    excludePatterns,
    getInputPaths,
  );
}

/**
 * Evaluates import patterns against bundle's imported dependencies. Filters based on imports only.
 * Determines if bundle should be included based on its imported dependency paths.
 *
 * @param output - Bundle output containing imports to evaluate
 * @param includePatterns - Compiled patterns that paths must match (empty means allow all)
 * @param excludePatterns - Compiled patterns that paths must not match (empty means exclude none)
 * @returns True if bundle should be included based on import pattern evaluation
 */
export function importsMatchPatterns(
  output: UnifiedStatsBundle,
  includePatterns: PatternMatcher[],
  excludePatterns: PatternMatcher[],
): boolean {
  return evaluateBundlePatterns(
    output,
    includePatterns,
    excludePatterns,
    getImportPaths,
  );
}

/**
 * Normalizes selection options by merging global patterns into specific types.
 * Provides defaults for missing patterns and eliminates global include/exclude from the result.
 *
 * @param options - Raw selection options that may include global patterns
 * @returns Normalized selection config with global patterns merged into specific types
 *
 * @example
 * normalizeSelectionOptions({
 *   include: ['src/**'],
 *   includeOutputs: ['*.js']
 * })
 * // → { includeOutputs: ['*.js', 'src/**'], excludeOutputs: [], ... }
 */
export function normalizeSelectionOptions(
  options: SelectionOptions,
): SelectionConfig {
  const globalInclude = options.include || [];
  const globalExclude = options.exclude || [];

  return {
    includeOutputs: [...(options.includeOutputs || []), ...globalInclude],
    excludeOutputs: [...(options.excludeOutputs || []), ...globalExclude],
    includeInputs: [...(options.includeInputs || []), ...globalInclude],
    excludeInputs: [...(options.excludeInputs || []), ...globalExclude],
    includeImports: [...(options.includeImports || []), ...globalInclude],
    excludeImports: [...(options.excludeImports || []), ...globalExclude],
    includeEntryPoints: [
      ...(options.includeEntryPoints || []),
      ...globalInclude,
    ],
    excludeEntryPoints: [
      ...(options.excludeEntryPoints || []),
      ...globalExclude,
    ],
  };
}

/**
 * Compiles all selection patterns into matchers. Enables efficient pattern reuse.
 * Transforms string patterns into cached matcher functions for all selection criteria.
 * Merges global include/exclude patterns into all specific selection types.
 *
 * @param options - Selection options containing pattern arrays for all filter types
 * @returns Object with compiled pattern matchers for each selection criteria type
 * @throws {Error} When options contain invalid pattern syntax
 *
 * @example
 * compileSelectionPatterns({ includeOutputs: ['*.js'], excludeInputs: ['*.test.ts'] })
 * // → { includeOutputs: [Function], excludeInputs: [Function], ... }
 */
export function compileSelectionPatterns(
  options: SelectionOptions,
): CompiledPatterns {
  const normalizedOptions = normalizeSelectionOptions(options);

  // Compile all normalized pattern types
  return {
    includeOutputs: compilePatterns(normalizedOptions.includeOutputs),
    excludeOutputs: compilePatterns(normalizedOptions.excludeOutputs),
    includeInputs: compilePatterns(normalizedOptions.includeInputs),
    excludeInputs: compilePatterns(normalizedOptions.excludeInputs),
    includeImports: compilePatterns(normalizedOptions.includeImports),
    excludeImports: compilePatterns(normalizedOptions.excludeImports),
    includeEntryPoints: compilePatterns(normalizedOptions.includeEntryPoints),
    excludeEntryPoints: compilePatterns(normalizedOptions.excludeEntryPoints),
  };
}

export { clearSelectionCaches };

/**
 * Determines if bundle matches selection criteria. Optimized with early exits.
 * Evaluates entryPoint, output, and input patterns in sequence to decide inclusion.
 *
 * @param output - Bundle output containing path, entryPoint, and inputs to evaluate
 * @param patterns - Compiled pattern matchers for all selection criteria
 * @returns True if bundle should be included based on all pattern evaluations
 * @throws Never throws, but may return false for invalid inputs
 *
 * @example
 * isBundleSelected(output, patterns) // → true if bundle matches all patterns
 * isBundleSelected(output, patterns) // → false if bundle fails any pattern check
 */
export function isBundleSelected(
  output: UnifiedStatsBundle,
  patterns: CompiledPatterns,
): boolean {
  // Entry point evaluation - early exit if no entry point but include patterns exist
  if (
    patterns.includeEntryPoints.length > 0 ||
    patterns.excludeEntryPoints.length > 0
  ) {
    if (output.entryPoint) {
      if (
        !evaluatePatternCriteria(
          [output.entryPoint],
          patterns.includeEntryPoints,
          patterns.excludeEntryPoints,
        )
      ) {
        return false;
      }
    } else if (patterns.includeEntryPoints.length > 0) {
      return false; // No entry point but include patterns require one
    }
  }

  // Output path evaluation - check bundle output path
  if (
    !evaluatePatternCriteria(
      [output.path],
      patterns.includeOutputs,
      patterns.excludeOutputs,
    )
  ) {
    return false;
  }

  // Input paths evaluation - check bundle input files
  if (
    !inputsMatchPatterns(output, patterns.includeInputs, patterns.excludeInputs)
  ) {
    return false;
  }

  // Import paths evaluation - check bundle imported dependencies
  if (
    !importsMatchPatterns(
      output,
      patterns.includeImports,
      patterns.excludeImports,
    )
  ) {
    return false;
  }

  return true;
}

/**
 * Selects bundles matching selection criteria and includes static import dependencies.
 * Applies include/exclude patterns across outputs, inputs, and entry points.
 * Preserves static imports that contribute to bundle size even when excluded by patterns.
 *
 * @param unifiedStats - Bundle statistics containing outputs with their metadata and dependencies
 * @param selectionOptions - Filtering criteria with include/exclude patterns for outputs, inputs, and entry points
 * @returns New UnifiedStats object containing selected outputs and their static import dependencies
 * @throws {Error} When no selection patterns are provided or patterns are invalid
 *
 * @example
 * // Select only JavaScript files
 * selectBundles(stats, { includeOutputs: ['*.js'] })
 *
 * // Complex filtering with multiple criteria
 * selectBundles(stats, {
 *   includeOutputs: ['dist/*.js'],
 *   excludeOutputs: ['*.test.js'],
 *   includeInputs: ['src/**'],
 *   excludeInputs: ['src/legacy/**']
 * })
 */
export function selectBundles(
  unifiedStats: UnifiedStats,
  selectionOptions: SelectionConfig,
): UnifiedStats {
  const patterns = compileSelectionPatterns(selectionOptions);

  validateSelectionPatterns(patterns);

  // Step 1: Select bundles that match the selection criteria directly
  const directlySelected = Object.entries(unifiedStats).reduce<UnifiedStats>(
    (selectedStats, [outputKey, output]) => {
      if (isBundleSelected(output, patterns)) {
        selectedStats[outputKey] = output;
      }
      return selectedStats;
    },
    {},
  );

  // Step 2: Add static import dependencies that contribute to bundle size
  const finalSelected = { ...directlySelected };

  // For each selected bundle, check its imports and include static imports
  Object.values(directlySelected).forEach(
    (selectedOutput: UnifiedStatsBundle) => {
      if (selectedOutput.imports) {
        selectedOutput.imports.forEach((importInfo: UnifiedStatsImport) => {
          // Only include static imports (import-statement) as they contribute to bundle size
          if (importInfo.kind === 'import-statement') {
            const importedBundle =
              unifiedStats[getOutputKeyFromPath(unifiedStats, importInfo.path)];
            if (
              importedBundle &&
              !finalSelected[
                getOutputKeyFromPath(unifiedStats, importInfo.path)
              ]
            ) {
              // Add the static import dependency
              finalSelected[
                getOutputKeyFromPath(unifiedStats, importInfo.path)
              ] = importedBundle;
            }
          }
          // Dynamic imports (dynamic-import) are not included as they don't contribute to bundle size
        });
      }
    },
  );

  return finalSelected;
}

/**
 * Finds the output key for a given path in unified stats.
 * Helper function to locate bundle entries by their path property.
 */
export function getOutputKeyFromPath(
  unifiedStats: UnifiedStats,
  path: string,
): string {
  for (const [key, output] of Object.entries(unifiedStats)) {
    if ((output as UnifiedStatsBundle).path === path) {
      return key;
    }
  }
  return path; // Fallback to using the path as key if not found
}
