import type { GroupingRule } from '../types.js';
import type {
  UnifiedStats,
  UnifiedStatsBundle,
  UnifiedStatsImport,
} from '../unify/unified-stats.types.js';
import { type PatternMatcher, compilePattern } from './details/grouping.js';

/**
 * Configuration for output file filtering. Controls which generated bundle files are included.
 */
export type SelectionOutputsConfig = {
  includeOutputs: string[];
  excludeOutputs: string[];
};

/**
 * Configuration for input file filtering. Controls which source files are considered.
 */
export type SelectionInputsConfig = {
  includeInputs: string[];
  excludeInputs: string[];
};

export type SelectionConfig = {
  mode: 'bundle' | 'matchingOnly' | 'startup' | 'dependencies';
} & SelectionOutputsConfig &
  SelectionInputsConfig;

export type CompiledPatterns = Omit<
  Record<keyof SelectionConfig, PatternMatcher[]>,
  'mode'
>;

const COMPILED_PATTERNS_CACHE = new Map<string, PatternMatcher[]>();
const BUNDLE_PATHS_CACHE = new Map<
  UnifiedStatsBundle,
  { inputs: string[]; imports: string[] }
>();
let PATH_TO_KEY_INDEX: Map<string, string> | null = null;

function createPathToKeyIndex(unifiedStats: UnifiedStats): Map<string, string> {
  const index = new Map<string, string>();
  for (const [key, bundle] of Object.entries(unifiedStats)) {
    index.set(bundle.path, key);
  }
  return index;
}

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

  for (const path of paths) {
    for (const matcher of includePatterns) {
      if (matcher(path)) {
        return true;
      }
    }
  }

  return false;
}

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
  const hasAnyPatterns =
    patterns.includeOutputs.length > 0 ||
    patterns.excludeOutputs.length > 0 ||
    patterns.includeInputs.length > 0 ||
    patterns.excludeInputs.length > 0;

  if (!hasAnyPatterns) {
    throw new Error(
      'Selection requires at least one include/exclude pattern for outputs or inputs. ' +
        'Provide patterns like: { includeOutputs: ["*.js"] } or { includeInputs: ["src/**"] }',
    );
  }
}

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

export function compileSelectionPatterns(
  normalizedOptions: SelectionConfig,
): CompiledPatterns {
  return {
    includeOutputs: compilePatterns(normalizedOptions.includeOutputs),
    excludeOutputs: compilePatterns(normalizedOptions.excludeOutputs),
    includeInputs: compilePatterns(normalizedOptions.includeInputs),
    excludeInputs: compilePatterns(normalizedOptions.excludeInputs),
  };
}

export function isBundleSelected(
  output: UnifiedStatsBundle,
  patterns: CompiledPatterns,
  mode: 'bundle' | 'matchingOnly' | 'startup' | 'dependencies' = 'bundle',
): boolean {
  // MatchingOnly mode: only select if inputs match patterns
  if (mode === 'matchingOnly') {
    if (patterns.includeInputs.length === 0) {
      return false; // MatchingOnly mode requires input patterns
    }
    return inputsMatchPatterns(
      output,
      patterns.includeInputs,
      patterns.excludeInputs,
    );
  }

  // For bundle, startup, and dependencies modes: check output patterns first
  if (patterns.includeOutputs.length > 0) {
    const outputMatches = evaluatePatternCriteria(
      [output.path],
      patterns.includeOutputs,
      patterns.excludeOutputs,
    );
    if (!outputMatches) {
      return false;
    }
  }

  // Check input patterns if specified
  if (patterns.includeInputs.length > 0) {
    const inputMatches = inputsMatchPatterns(
      output,
      patterns.includeInputs,
      patterns.excludeInputs,
    );
    if (!inputMatches) {
      return false;
    }
  }

  // If no include patterns at all, reject
  if (
    patterns.includeOutputs.length === 0 &&
    patterns.includeInputs.length === 0
  ) {
    return false;
  }

  // Final exclusion check
  return !isExcluded(output, patterns);
}

function isExcluded(
  output: UnifiedStatsBundle,
  patterns: CompiledPatterns,
): boolean {
  // Check output exclusions
  if (patterns.excludeOutputs.length > 0) {
    for (const matcher of patterns.excludeOutputs) {
      if (matcher(output.path)) {
        return true;
      }
    }
  }

  // Check input exclusions
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

  return false;
}

export function selectBundles(
  unifiedStats: UnifiedStats,
  selectionConfig: SelectionConfig,
): UnifiedStats {
  // MatchingOnly mode behavior: Only matching input parts are included in output
  // - Bundles with no matching inputs are completely excluded
  // - Bundles with matching inputs have all non-matching inputs removed
  // - Bundle size is recalculated as sum of matching input bytes only
  // - Import dependencies and other metadata are excluded (matching-focused analysis)

  const patterns = compileSelectionPatterns(selectionConfig);
  validateSelectionPatterns(patterns);

  BUNDLE_PATHS_CACHE.clear();
  PATH_TO_KEY_INDEX = createPathToKeyIndex(unifiedStats);

  const selectedBundles = new Map<string, UnifiedStatsBundle>();
  const staticImportStack: string[] = [];

  // Select bundles based on mode
  for (const [outputKey, output] of Object.entries(unifiedStats)) {
    if (isBundleSelected(output, patterns, selectionConfig.mode)) {
      let processedBundle = output;

      // MatchingOnly mode: filter inputs and recalculate size
      if (selectionConfig.mode === 'matchingOnly' && output.inputs) {
        const filteredInputs: typeof output.inputs = {};
        let filteredInputBytes = 0;

        const inputMatchers = patterns.includeInputs;
        for (const [inputPath, inputData] of Object.entries(output.inputs)) {
          const matchesPattern = inputMatchers.some(matcher =>
            matcher(inputPath),
          );
          if (matchesPattern) {
            filteredInputs[inputPath] = inputData;
            filteredInputBytes += inputData.bytes;
          }
        }

        if (Object.keys(filteredInputs).length > 0) {
          // MatchingOnly mode: ONLY include matching parts, remove everything else
          processedBundle = {
            path: output.path, // Keep bundle path
            bytes: filteredInputBytes, // Recalculated size from matching inputs only
            inputs: filteredInputs, // ONLY matching inputs
            // Explicitly exclude:
            // - imports (not relevant for matching analysis)
            // - entryPoint (not relevant for matching analysis)
            // - other metadata (focus only on matching input features)
          };
        } else {
          continue; // Skip bundle entirely - no matching inputs found
        }
      }

      selectedBundles.set(outputKey, processedBundle);

      // Add static imports to stack for inclusion (startup and dependencies modes only)
      // FIX 1: Bundle mode should NOT process imports - it only includes the file + its inputs
      if (
        (selectionConfig.mode === 'startup' ||
          selectionConfig.mode === 'dependencies') &&
        processedBundle.imports
      ) {
        for (const importInfo of processedBundle.imports) {
          // Dependencies mode includes all imports, startup only static imports
          if (
            selectionConfig.mode === 'dependencies' ||
            importInfo.kind === 'import-statement'
          ) {
            staticImportStack.push(importInfo.path);
          }
        }
      }
    }
  }

  // Process static imports (for startup and dependencies modes only)
  if (
    selectionConfig.mode === 'startup' ||
    selectionConfig.mode === 'dependencies'
  ) {
    const processedImports = new Set<string>();

    while (staticImportStack.length > 0) {
      const importPath = staticImportStack.pop()!;

      if (processedImports.has(importPath)) {
        continue;
      }
      processedImports.add(importPath);

      const importKey = PATH_TO_KEY_INDEX.get(importPath) || importPath;
      const importedBundle = unifiedStats[importKey];

      if (importedBundle && !selectedBundles.has(importKey)) {
        // FIX 2: Check if imported bundle should be excluded due to excludeInputs
        if (!isExcluded(importedBundle, patterns)) {
          selectedBundles.set(importKey, importedBundle);

          // Add nested static imports (only if bundle wasn't excluded)
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
    }
  }

  // Build result
  const result: UnifiedStats = {};
  for (const [key, bundle] of selectedBundles) {
    result[key] = bundle;
  }

  PATH_TO_KEY_INDEX = null;
  return result;
}

export function getOutputKeyFromPath(
  unifiedStats: UnifiedStats,
  path: string,
): string {
  if (PATH_TO_KEY_INDEX) {
    return PATH_TO_KEY_INDEX.get(path) || path;
  }

  for (const [key, output] of Object.entries(unifiedStats)) {
    if ((output as UnifiedStatsBundle).path === path) {
      return key;
    }
  }
  return path;
}
