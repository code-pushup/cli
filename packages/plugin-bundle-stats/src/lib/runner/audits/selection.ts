import type { SelectionOptions } from '../../types.js';
import type {
  UnifiedStats,
  UnifiedStatsBundle,
  UnifiedStatsImport,
} from '../unify/unified-stats.types.js';
import { type PatternMatcher, compilePattern } from './details/grouping.js';

// Performance optimizations: Caches and indexes
const COMPILED_PATTERNS_CACHE = new Map<string, PatternMatcher[]>();
const BUNDLE_PATHS_CACHE = new Map<
  UnifiedStatsBundle,
  { inputs: string[]; imports: string[] }
>();
let PATH_TO_KEY_INDEX: Map<string, string> | null = null;

/**
 * Creates index for O(1) path-to-key lookups. Avoids repeated O(n) searches.
 */
function createPathToKeyIndex(unifiedStats: UnifiedStats): Map<string, string> {
  const index = new Map<string, string>();
  for (const [key, bundle] of Object.entries(unifiedStats)) {
    index.set(bundle.path, key);
  }
  return index;
}

/**
 * Extracts and caches input paths from output. Prevents repeated path extraction.
 */
function getCachedInputPaths(output: UnifiedStatsBundle): string[] {
  let cached = BUNDLE_PATHS_CACHE.get(output);
  if (!cached) {
    cached = {
      inputs: output.inputs ? Object.keys(output.inputs) : [],
      imports: output.imports
        ? output.imports.map((imp: UnifiedStatsImport) => imp.path)
        : [],
    };
    BUNDLE_PATHS_CACHE.set(output, cached);
  }
  return cached.inputs;
}

/**
 * Extracts and caches import paths from output. Prevents repeated path extraction.
 */
function getCachedImportPaths(output: UnifiedStatsBundle): string[] {
  let cached = BUNDLE_PATHS_CACHE.get(output);
  if (!cached) {
    cached = {
      inputs: output.inputs ? Object.keys(output.inputs) : [],
      imports: output.imports
        ? output.imports.map((imp: UnifiedStatsImport) => imp.path)
        : [],
    };
    BUNDLE_PATHS_CACHE.set(output, cached);
  }
  return cached.imports;
}

/**
 * Compiles patterns with caching. Avoids recompilation overhead.
 */
function compilePatterns(
  patterns: string[],
  options = { normalizeRelativePaths: true },
): PatternMatcher[] {
  const cacheKey = JSON.stringify({ patterns, options });

  let compiled = COMPILED_PATTERNS_CACHE.get(cacheKey);
  if (!compiled) {
    compiled = patterns.map(pattern => compilePattern(pattern, options));
    COMPILED_PATTERNS_CACHE.set(cacheKey, compiled);
  }

  return compiled;
}

/**
 * Evaluates paths against include/exclude patterns. Core filtering logic with early exits for performance.
 */
function evaluatePathsWithIncludeExclude(
  paths: string[],
  includePatterns: PatternMatcher[],
  excludePatterns: PatternMatcher[],
): boolean {
  if (paths.length === 0) {
    return includePatterns.length === 0;
  }

  if (includePatterns.length === 0 && excludePatterns.length === 0) {
    return true;
  }

  // Early exit: Check exclusions first as they're typically fewer and can eliminate quickly
  if (excludePatterns.length > 0) {
    for (const path of paths) {
      for (const matcher of excludePatterns) {
        if (matcher(path)) {
          return false;
        }
      }
    }
  }

  if (includePatterns.length === 0) {
    return true;
  }

  // Early exit: Return true immediately when first inclusion match is found
  for (const path of paths) {
    for (const matcher of includePatterns) {
      if (matcher(path)) {
        return true;
      }
    }
  }

  return false;
}

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
 * Evaluates bundle patterns against include/exclude criteria. Optimized with cached path extraction.
 */
function evaluateBundlePatterns(
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

export function getInputPaths(output: UnifiedStatsBundle): string[] {
  return getCachedInputPaths(output);
}

export function getImportPaths(output: UnifiedStatsBundle): string[] {
  return getCachedImportPaths(output);
}

export function inputsMatchPatterns(
  output: UnifiedStatsBundle,
  includePatterns: PatternMatcher[],
  excludePatterns: PatternMatcher[],
): boolean {
  return evaluateBundlePatterns(
    output,
    includePatterns,
    excludePatterns,
    getCachedInputPaths,
  );
}

export function importsMatchPatterns(
  output: UnifiedStatsBundle,
  includePatterns: PatternMatcher[],
  excludePatterns: PatternMatcher[],
): boolean {
  return evaluateBundlePatterns(
    output,
    includePatterns,
    excludePatterns,
    getCachedImportPaths,
  );
}

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

export function compileSelectionPatterns(
  options: SelectionOptions,
): CompiledPatterns {
  const normalizedOptions = normalizeSelectionOptions(options);

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

/**
 * Checks if bundle matches selection patterns. Optimized with early exits and cached pattern checks.
 */
export function isBundleSelected(
  output: UnifiedStatsBundle,
  patterns: CompiledPatterns,
): boolean {
  const hasAnyIncludePatterns =
    patterns.includeOutputs.length > 0 ||
    patterns.includeEntryPoints.length > 0 ||
    patterns.includeInputs.length > 0 ||
    patterns.includeImports.length > 0;

  if (!hasAnyIncludePatterns) {
    return !isExcluded(output, patterns);
  }

  const hasOutputPatterns = patterns.includeOutputs.length > 0;
  const hasEntryPatterns = patterns.includeEntryPoints.length > 0;

  if (hasOutputPatterns || hasEntryPatterns) {
    if (
      hasOutputPatterns &&
      evaluatePatternCriteria(
        [output.path],
        patterns.includeOutputs,
        patterns.excludeOutputs,
      )
    ) {
      return true;
    }

    if (
      hasEntryPatterns &&
      output.entryPoint &&
      evaluatePatternCriteria(
        [output.entryPoint],
        patterns.includeEntryPoints,
        patterns.excludeEntryPoints,
      )
    ) {
      return true;
    }
  }

  if (patterns.includeInputs.length > 0) {
    if (
      inputsMatchPatterns(
        output,
        patterns.includeInputs,
        patterns.excludeInputs,
      )
    ) {
      return true;
    }
  }

  if (patterns.includeImports.length > 0) {
    if (
      importsMatchPatterns(
        output,
        patterns.includeImports,
        patterns.excludeImports,
      )
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if bundle should be excluded. Optimized with early exits.
 */
function isExcluded(
  output: UnifiedStatsBundle,
  patterns: CompiledPatterns,
): boolean {
  if (patterns.excludeOutputs.length > 0) {
    for (const matcher of patterns.excludeOutputs) {
      if (matcher(output.path)) {
        return true;
      }
    }
  }

  if (patterns.excludeEntryPoints.length > 0 && output.entryPoint) {
    for (const matcher of patterns.excludeEntryPoints) {
      if (matcher(output.entryPoint)) {
        return true;
      }
    }
  }

  if (patterns.excludeInputs.length > 0) {
    const inputPaths = getCachedInputPaths(output);
    for (const path of inputPaths) {
      for (const matcher of patterns.excludeInputs) {
        if (matcher(path)) {
          return true;
        }
      }
    }
  }

  if (patterns.excludeImports.length > 0) {
    const importPaths = getCachedImportPaths(output);
    for (const path of importPaths) {
      for (const matcher of patterns.excludeImports) {
        if (matcher(path)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Selects bundles based on criteria with optimized performance.
 * Includes cycle detection and O(1) path lookups for import resolution.
 */
export function selectBundles(
  unifiedStats: UnifiedStats,
  selectionOptions: SelectionConfig,
): UnifiedStats {
  const patterns = compileSelectionPatterns(selectionOptions);
  validateSelectionPatterns(patterns);

  // Clear caches for new selection operation
  BUNDLE_PATHS_CACHE.clear();

  // Create O(1) lookup index for path-to-key resolution
  PATH_TO_KEY_INDEX = createPathToKeyIndex(unifiedStats);

  const selectedBundles = new Map<string, UnifiedStatsBundle>();
  const staticImportStack: string[] = [];

  // Primary selection phase - process all bundles
  for (const [outputKey, output] of Object.entries(unifiedStats)) {
    if (isBundleSelected(output, patterns)) {
      selectedBundles.set(outputKey, output);

      // Collect static imports for dependency resolution
      if (output.imports) {
        for (const importInfo of output.imports) {
          if (importInfo.kind === 'import-statement') {
            staticImportStack.push(importInfo.path);
          }
        }
      }
    }
  }

  // Optimized static import dependency resolution with cycle detection
  const processedImports = new Set<string>();

  while (staticImportStack.length > 0) {
    const importPath = staticImportStack.pop()!;

    // Cycle detection - skip already processed imports
    if (processedImports.has(importPath)) {
      continue;
    }

    processedImports.add(importPath);

    // O(1) lookup using index instead of O(n) search
    const importKey = PATH_TO_KEY_INDEX.get(importPath) || importPath;
    const importedBundle = unifiedStats[importKey];

    if (importedBundle && !selectedBundles.has(importKey)) {
      selectedBundles.set(importKey, importedBundle);

      // Add nested static imports to processing stack
      if (importedBundle.imports) {
        for (const nestedImport of importedBundle.imports) {
          if (
            nestedImport.kind === 'import-statement' &&
            !processedImports.has(nestedImport.path)
          ) {
            staticImportStack.push(nestedImport.path);
          }
        }
      }
    }
  }

  // Build final result efficiently
  const result: UnifiedStats = {};
  for (const [key, bundle] of selectedBundles) {
    result[key] = bundle;
  }

  // Clear index after use to free memory
  PATH_TO_KEY_INDEX = null;

  return result;
}

/**
 * Gets output key from path using O(1) lookup. Optimized replacement for linear search.
 */
export function getOutputKeyFromPath(
  unifiedStats: UnifiedStats,
  path: string,
): string {
  if (PATH_TO_KEY_INDEX) {
    return PATH_TO_KEY_INDEX.get(path) || path;
  }

  // Fallback to linear search if index not available (shouldn't happen in normal flow)
  for (const [key, output] of Object.entries(unifiedStats)) {
    if ((output as UnifiedStatsBundle).path === path) {
      return key;
    }
  }
  return path;
}
