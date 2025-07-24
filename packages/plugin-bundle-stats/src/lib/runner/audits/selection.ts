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

/**
 * Configuration for import filtering. Controls which imported modules are analyzed.
 */
export type SelectionImportsConfig = {
  includeImports: string[];
  excludeImports: string[];
};

/**
 * Configuration for entry point filtering. Controls which entry points are processed.
 */
export type SelectionEntryPointsConfig = {
  includeEntryPoints: string[];
  excludeEntryPoints: string[];
};

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

export type SelectionConfig = SelectionOutputsConfig &
  SelectionInputsConfig &
  SelectionImportsConfig &
  SelectionEntryPointsConfig;

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
    includeImports: compilePatterns(normalizedOptions.includeImports),
    excludeImports: compilePatterns(normalizedOptions.excludeImports),
    includeEntryPoints: compilePatterns(normalizedOptions.includeEntryPoints),
    excludeEntryPoints: compilePatterns(normalizedOptions.excludeEntryPoints),
  };
}

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

  let matchesInclude = false;

  if (patterns.includeOutputs.length > 0) {
    if (
      evaluatePatternCriteria(
        [output.path],
        patterns.includeOutputs,
        patterns.excludeOutputs,
      )
    ) {
      matchesInclude = true;
    }
  }

  if (
    !matchesInclude &&
    patterns.includeEntryPoints.length > 0 &&
    output.entryPoint
  ) {
    if (
      evaluatePatternCriteria(
        [output.entryPoint],
        patterns.includeEntryPoints,
        patterns.excludeEntryPoints,
      )
    ) {
      matchesInclude = true;
    }
  }

  if (!matchesInclude && patterns.includeInputs.length > 0) {
    if (
      inputsMatchPatterns(
        output,
        patterns.includeInputs,
        patterns.excludeInputs,
      )
    ) {
      matchesInclude = true;
    }
  }

  if (!matchesInclude && patterns.includeImports.length > 0) {
    if (
      importsMatchPatterns(
        output,
        patterns.includeImports,
        patterns.excludeImports,
      )
    ) {
      matchesInclude = true;
    }
  }

  if (!matchesInclude) {
    return false;
  }

  return !isExcluded(output, patterns);
}

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

export function selectBundles(
  unifiedStats: UnifiedStats,
  selectionConfig: SelectionConfig,
): UnifiedStats {
  const patterns = compileSelectionPatterns(selectionConfig);
  validateSelectionPatterns(patterns);

  BUNDLE_PATHS_CACHE.clear();

  PATH_TO_KEY_INDEX = createPathToKeyIndex(unifiedStats);

  const selectedBundles = new Map<string, UnifiedStatsBundle>();
  const staticImportStack: string[] = [];

  for (const [outputKey, output] of Object.entries(unifiedStats)) {
    if (isBundleSelected(output, patterns)) {
      selectedBundles.set(outputKey, output);

      if (output.imports) {
        for (const importInfo of output.imports) {
          if (importInfo.kind === 'import-statement') {
            staticImportStack.push(importInfo.path);
          }
        }
      }
    }
  }

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
      selectedBundles.set(importKey, importedBundle);

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
