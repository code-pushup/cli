import type {
  UnifiedStats,
  UnifiedStatsBundle,
} from '../unify/unified-stats.types.js';
import { type PatternMatcher, compilePattern } from './details/grouping.js';

export type SelectionOutputsConfig = {
  includeOutputs: string[];
  excludeOutputs: string[];
};

export type SelectionInputsConfig = {
  includeInputs: string[];
  excludeInputs: string[];
};

export type SelectionMode =
  | 'matchingOnly'
  | 'bundle'
  | 'withStartupDeps'
  | 'withAllDeps';

export type SelectionConfig = {
  mode: SelectionMode;
} & SelectionOutputsConfig &
  SelectionInputsConfig;

export type CompiledPatterns = {
  includeOutputs: PatternMatcher[];
  excludeOutputs: PatternMatcher[];
  includeInputs: PatternMatcher[];
  excludeInputs: PatternMatcher[];
};

function compilePatterns(patterns: string[]): PatternMatcher[] {
  return patterns.map(pattern =>
    compilePattern(pattern, { normalizeRelativePaths: true }),
  );
}

function matchesAnyPattern(path: string, patterns: PatternMatcher[]): boolean {
  for (const pattern of patterns) {
    if (pattern(path)) return true; // Early exit on first match
  }
  return false;
}

function* getInputPaths(bundle: UnifiedStatsBundle): Generator<string> {
  if (!bundle.inputs) return;
  for (const path of Object.keys(bundle.inputs)) {
    yield path;
  }
}

function* getImportPaths(bundle: UnifiedStatsBundle): Generator<string> {
  if (!bundle.imports) return;
  for (const imp of bundle.imports) {
    yield imp.path;
  }
}

function hasMatchingInput(
  bundle: UnifiedStatsBundle,
  patterns: PatternMatcher[],
): boolean {
  if (patterns.length === 0) return false;
  for (const path of getInputPaths(bundle)) {
    if (matchesAnyPattern(path, patterns)) return true; // Stop on first match
  }
  return false;
}

function hasExcludedInput(
  bundle: UnifiedStatsBundle,
  patterns: PatternMatcher[],
): boolean {
  if (patterns.length === 0) return false;
  for (const path of getInputPaths(bundle)) {
    if (matchesAnyPattern(path, patterns)) return true; // Stop on first exclusion
  }
  return false;
}

function pathsMatchPatterns(
  paths: Generator<string>,
  includePatterns: PatternMatcher[],
  excludePatterns: PatternMatcher[],
): boolean {
  if (includePatterns.length === 0 && excludePatterns.length === 0) return true;

  const pathArray: string[] = [];
  for (const path of paths) {
    pathArray.push(path);
  }

  if (pathArray.length === 0) return includePatterns.length === 0;

  // Check excludes first (early exit)
  if (excludePatterns.length > 0) {
    for (const path of pathArray) {
      if (matchesAnyPattern(path, excludePatterns)) return false;
    }
  }

  // If no includes specified, and nothing excluded, include it
  if (includePatterns.length === 0) return true;

  // Check includes
  for (const path of pathArray) {
    if (matchesAnyPattern(path, includePatterns)) return true;
  }

  return false;
}

// Mode-specific processors for optimized selection
const bundleSelectors = {
  matchingOnly: (
    bundle: UnifiedStatsBundle,
    patterns: CompiledPatterns,
  ): boolean => {
    return (
      patterns.includeInputs.length > 0 &&
      hasMatchingInput(bundle, patterns.includeInputs)
    );
  },

  bundle: (bundle: UnifiedStatsBundle, patterns: CompiledPatterns): boolean => {
    const hasIncludePatterns =
      patterns.includeOutputs.length > 0 || patterns.includeInputs.length > 0;
    if (!hasIncludePatterns) return false;

    // Check output patterns
    if (patterns.includeOutputs.length > 0) {
      if (!matchesAnyPattern(bundle.path, patterns.includeOutputs))
        return false;
    }

    // Check input patterns
    if (patterns.includeInputs.length > 0) {
      if (!hasMatchingInput(bundle, patterns.includeInputs)) return false;
    }

    // Check exclusions
    if (matchesAnyPattern(bundle.path, patterns.excludeOutputs)) return false;
    if (hasExcludedInput(bundle, patterns.excludeInputs)) return false;

    return true;
  },

  withStartupDeps: (
    bundle: UnifiedStatsBundle,
    patterns: CompiledPatterns,
  ): boolean => {
    return bundleSelectors.bundle(bundle, patterns);
  },

  withAllDeps: (
    bundle: UnifiedStatsBundle,
    patterns: CompiledPatterns,
  ): boolean => {
    return bundleSelectors.bundle(bundle, patterns);
  },
};

function processMatchingOnlyBundle(
  bundle: UnifiedStatsBundle,
  patterns: CompiledPatterns,
): UnifiedStatsBundle | null {
  if (!bundle.inputs) return null;

  const filteredInputs: typeof bundle.inputs = {};
  let filteredBytes = 0;
  let hasMatches = false;

  for (const [inputPath, inputData] of Object.entries(bundle.inputs)) {
    if (matchesAnyPattern(inputPath, patterns.includeInputs)) {
      filteredInputs[inputPath] = inputData;
      filteredBytes += inputData.bytes;
      hasMatches = true;
    }
  }

  return hasMatches
    ? {
        path: bundle.path,
        bytes: filteredBytes,
        inputs: filteredInputs,
      }
    : null;
}

function collectImportsForMode(
  bundle: UnifiedStatsBundle,
  mode: SelectionMode,
): string[] {
  if (!bundle.imports) return [];

  const imports: string[] = [];
  for (const imp of bundle.imports) {
    if (mode === 'withAllDeps' || imp.kind === 'import-statement') {
      imports.push(imp.path);
    }
  }
  return imports;
}

function validatePatterns(patterns: CompiledPatterns): void {
  const hasAnyPatterns = [
    patterns.includeOutputs,
    patterns.excludeOutputs,
    patterns.includeInputs,
    patterns.excludeInputs,
  ].some(arr => arr.length > 0);

  if (!hasAnyPatterns) {
    throw new Error(
      'Selection requires at least one include/exclude pattern for outputs or inputs. ' +
        'Provide patterns like: { includeOutputs: ["*.js"] } or { includeInputs: ["src/**"] }',
    );
  }
}

export function compileSelectionPatterns(
  config: SelectionConfig,
): CompiledPatterns {
  return {
    includeOutputs: compilePatterns(config.includeOutputs),
    excludeOutputs: compilePatterns(config.excludeOutputs),
    includeInputs: compilePatterns(config.includeInputs),
    excludeInputs: compilePatterns(config.excludeInputs),
  };
}

export function selectBundles(
  unifiedStats: UnifiedStats,
  selectionConfig: SelectionConfig,
): UnifiedStats {
  // 🚀 Smart Optimization 1: Single-pass pattern compilation
  const patterns = compileSelectionPatterns(selectionConfig);
  validatePatterns(patterns);

  // 🚀 Smart Optimization 2: O(1) bundle lookups with simple map
  const pathToKey = new Map<string, string>();
  for (const [key, bundle] of Object.entries(unifiedStats)) {
    pathToKey.set(bundle.path, key);
  }

  const findBundleByPath = (path: string) => {
    const key = pathToKey.get(path);
    return key && unifiedStats[key] ? { key, bundle: unifiedStats[key] } : null;
  };

  // 🚀 Smart Optimization 3: Early exit & set-based processing
  const selectedBundles = new Map<string, UnifiedStatsBundle>();
  const excludedKeys = new Set<string>();

  // Get mode-specific selector for optimized processing
  const isSelected = (bundle: UnifiedStatsBundle): boolean => {
    switch (selectionConfig.mode) {
      case 'matchingOnly':
        return bundleSelectors.matchingOnly(bundle, patterns);
      case 'bundle':
        return bundleSelectors.bundle(bundle, patterns);
      case 'withStartupDeps':
        return bundleSelectors.withStartupDeps(bundle, patterns);
      case 'withAllDeps':
        return bundleSelectors.withAllDeps(bundle, patterns);
      default:
        return false;
    }
  };

  // Process all bundles with early exits
  for (const [key, bundle] of Object.entries(unifiedStats)) {
    if (!isSelected(bundle)) {
      excludedKeys.add(key);
      continue; // Early exit
    }

    let processedBundle = bundle;

    // Special processing for matchingOnly mode
    if (selectionConfig.mode === 'matchingOnly') {
      const filtered = processMatchingOnlyBundle(bundle, patterns);
      if (!filtered) {
        excludedKeys.add(key);
        continue; // Early exit
      }
      processedBundle = filtered;
    }

    selectedBundles.set(key, processedBundle);
  }

  // 🚀 Smart Optimization 4: Optimized dependency processing
  if (
    selectionConfig.mode === 'withStartupDeps' ||
    selectionConfig.mode === 'withAllDeps'
  ) {
    const processed = new Set<string>();
    const importsToProcess: string[] = [];

    // Collect all imports from selected bundles
    for (const bundle of selectedBundles.values()) {
      importsToProcess.push(
        ...collectImportsForMode(bundle, selectionConfig.mode),
      );
    }

    // Process imports with optimized lookups and early exits
    while (importsToProcess.length > 0) {
      const importPath = importsToProcess.pop()!;
      if (processed.has(importPath)) continue; // Early exit
      processed.add(importPath);

      const found = findBundleByPath(importPath);
      if (!found || selectedBundles.has(found.key)) continue; // Early exit

      // Check if import should be excluded
      if (matchesAnyPattern(found.bundle.path, patterns.excludeOutputs))
        continue;
      if (hasExcludedInput(found.bundle, patterns.excludeInputs)) continue;

      selectedBundles.set(found.key, found.bundle);

      // Add nested static imports for further processing
      if (found.bundle.imports) {
        for (const nestedImport of found.bundle.imports) {
          if (
            nestedImport.kind === 'import-statement' &&
            !processed.has(nestedImport.path)
          ) {
            importsToProcess.push(nestedImport.path);
          }
        }
      }
    }
  }

  return Object.fromEntries(selectedBundles);
}
