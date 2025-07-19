import type {
  UnifiedStats,
  UnifiedStatsOutput,
} from '../unify/unified-stats.types.js';
import {
  type PatternMatcher,
  clearPatternCache,
  compilePattern as sharedCompilePattern,
} from './details/utils/match-pattern.js';

export type includeOutputs = {
  includeOutputs: string[];
  excludeOutputs: string[];
};

export type includeInputs = {
  includeInputs: string[];
  excludeInputs: string[];
};

export type includeEntryPoints = {
  includeEntryPoints: string[];
  excludeEntryPoints: string[];
};

export type SelectionOptions = Partial<
  includeOutputs & includeInputs & includeEntryPoints
> &
  (
    | Pick<includeOutputs, 'includeOutputs'>
    | Pick<includeInputs, 'includeInputs'>
    | Pick<includeEntryPoints, 'includeEntryPoints'>
  );

type CompiledPatterns = Record<keyof SelectionOptions, PatternMatcher[]>;

const inputPathsCache = new Map<UnifiedStatsOutput, string[]>();

/**
 * Evaluates paths against include/exclude patterns. Core filtering logic for all path types.
 * Enables selective filtering by allowing users to focus on specific files while excluding unwanted ones.
 *
 * @param paths - Array of file paths to evaluate against patterns
 * @param include - Include pattern matchers (empty means allow all)
 * @param exclude - Exclude pattern matchers (empty means exclude none)
 * @returns True if paths should be included based on pattern evaluation
 *
 * @example
 * evaluateMatchers(['src/main.js'], [path => path.includes('src')], []) // → true
 * evaluateMatchers(['src/test.js'], [path => path.includes('src')], [path => path.includes('test')]) // → false
 */
export function evaluateMatchers(
  paths: string[],
  include: PatternMatcher[],
  exclude: PatternMatcher[],
): boolean {
  if (paths.length === 0) {
    return include.length === 0;
  }

  if (include.length === 0 && exclude.length === 0) {
    return true;
  }

  if (exclude.length > 0) {
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i]!;
      for (let j = 0; j < exclude.length; j++) {
        if (exclude[j]!(path)) {
          return false;
        }
      }
    }
  }

  if (include.length === 0) {
    return true;
  }

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]!;
    for (let j = 0; j < include.length; j++) {
      if (include[j]!(path)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Collects input paths and imports from bundle output. Prevents repeated path extraction.
 * Centralizes extraction of paths scattered across multiple nested locations in bundle structure.
 *
 * @param output - Bundle output containing inputs and imports to extract paths from
 * @returns Array of all input file paths and import paths found in the output
 *
 * @example
 * getInputPaths(output) // → ['src/main.js', 'src/utils.js', 'node_modules/lodash/index.js']
 */
export function getInputPaths(output: UnifiedStatsOutput): string[] {
  if (inputPathsCache.has(output)) {
    return inputPathsCache.get(output)!;
  }

  const inputPaths: string[] = [];

  if (output.inputs) {
    const inputKeys = Object.keys(output.inputs);

    const estimatedSize =
      inputKeys.length +
      (output.imports?.length || 0) +
      inputKeys.reduce(
        (sum, key) => sum + (output.inputs![key]?.imports?.length || 0),
        0,
      );

    const paths: string[] = new Array(estimatedSize);
    let pathIndex = 0;

    for (let i = 0; i < inputKeys.length; i++) {
      paths[pathIndex++] = inputKeys[i]!;

      const input = output.inputs[inputKeys[i]!];
      if (input?.imports) {
        for (let j = 0; j < input.imports.length; j++) {
          paths[pathIndex++] = input.imports[j]!.path;
        }
      }
    }

    if (output.imports) {
      for (let i = 0; i < output.imports.length; i++) {
        paths[pathIndex++] = output.imports[i]!.path;
      }
    }

    inputPaths.push(...paths.slice(0, pathIndex));
  }

  inputPathsCache.set(output, inputPaths);
  return inputPaths;
}

/**
 * Evaluates input patterns against output's inputs. Enables dependency-aware filtering.
 * Determines if bundle output should be included based on its input file paths.
 *
 * @param output - Bundle output containing inputs and imports to evaluate
 * @param includePatterns - Include pattern matchers (empty means allow all)
 * @param excludePatterns - Exclude pattern matchers (empty means exclude none)
 * @returns True if output should be included based on input pattern evaluation
 *
 * @example
 * evaluateInputs(output, [path => path.includes('src')], []) // → true if output has src inputs
 * evaluateInputs(output, [], [path => path.includes('node_modules')]) // → false if output has node_modules inputs
 */
export function evaluateInputs(
  output: UnifiedStatsOutput,
  includePatterns: PatternMatcher[],
  excludePatterns: PatternMatcher[],
): boolean {
  if (includePatterns.length === 0 && excludePatterns.length === 0) {
    return true;
  }

  const inputPaths = getInputPaths(output);
  return evaluateMatchers(inputPaths, includePatterns, excludePatterns);
}

/**
 * Determines if output matches selection criteria. Optimized with early exits.
 * Evaluates entryPoint, output, and input patterns in sequence to decide inclusion.
 *
 * @param outputKey - Key identifier for the output in the unified stats
 * @param output - Bundle output containing path, entryPoint, and inputs to evaluate
 * @param patterns - Compiled pattern matchers for all selection criteria
 * @returns True if output should be included based on all pattern evaluations
 *
 * @example
 * shouldSelectOutput('main.js', output, patterns) // → true if output matches all patterns
 * shouldSelectOutput('test.js', output, patterns) // → false if output fails any pattern check
 */
export function shouldSelectOutput(
  outputKey: string,
  output: UnifiedStatsOutput,
  patterns: CompiledPatterns,
): boolean {
  const outputPaths =
    output.path === outputKey ? [outputKey] : [outputKey, output.path];

  if (
    patterns.includeEntryPoints.length > 0 ||
    patterns.excludeEntryPoints.length > 0
  ) {
    if (output.entryPoint) {
      const entryPointsMatch = evaluateMatchers(
        [output.entryPoint],
        patterns.includeEntryPoints,
        patterns.excludeEntryPoints,
      );
      if (!entryPointsMatch) {
        return false;
      }
    } else if (patterns.includeEntryPoints.length > 0) {
      return false;
    }
  }

  if (
    patterns.includeOutputs.length > 0 ||
    patterns.excludeOutputs.length > 0
  ) {
    const outputsMatch = evaluateMatchers(
      outputPaths,
      patterns.includeOutputs,
      patterns.excludeOutputs,
    );
    if (!outputsMatch) {
      return false;
    }
  }

  if (patterns.includeInputs.length > 0 || patterns.excludeInputs.length > 0) {
    const inputsMatch = evaluateInputs(
      output,
      patterns.includeInputs,
      patterns.excludeInputs,
    );
    if (!inputsMatch) {
      return false;
    }
  }

  return true;
}

/**
 * Compiles pattern into cached matcher function. Avoids recompilation overhead.
 * Uses the shared pattern matching logic with support for relative paths.
 */
export function compilePattern(pattern: string): PatternMatcher {
  return sharedCompilePattern(pattern, { normalizeRelativePaths: true });
}

/**
 * Compiles all selection patterns into matchers. Enables efficient pattern reuse.
 * Transforms string patterns into cached matcher functions for all selection criteria.
 *
 * @param options - Selection options containing pattern arrays for all filter types
 * @returns Object with compiled pattern matchers for each selection criteria type
 *
 * @example
 * compileSelectionPatterns({ includeOutputs: ['*.js'], excludeInputs: ['*.test.ts'] })
 * // → { includeOutputs: [Function], excludeInputs: [Function], ... }
 */
export function compileSelectionPatterns(
  options: SelectionOptions,
): CompiledPatterns {
  const compiled: CompiledPatterns = {} as CompiledPatterns;

  for (const [key, patterns] of Object.entries(options)) {
    compiled[key as keyof SelectionOptions] = patterns.map(compilePattern);
  }

  return compiled;
}

/**
 * Clears all internal performance caches. Prevents memory leaks in long-running processes.
 * Resets pattern compilation cache and input paths cache to free memory.
 *
 * @example
 * // Clear caches after processing large bundles
 * clearSelectionCaches();
 *
 * // Or clear periodically in long-running processes
 * setInterval(clearSelectionCaches, 60000); // Clear every minute
 */
export function clearSelectionCaches(): void {
  clearPatternCache();
  inputPathsCache.clear();
}

/**
 * Selects artifacts matching selection criteria. Main entry point for bundle filtering.
 * Applies include/exclude patterns across outputs, inputs, and entry points.
 *
 * @param unifiedStats - Bundle statistics containing outputs with their metadata and dependencies
 * @param selectionOptions - Filtering criteria with include/exclude patterns for outputs, inputs, and entry points
 * @returns New UnifiedStats object containing only outputs that match all selection criteria
 *
 * @example
 * selectArtefacts(stats, { includeOutputs: ['main.js'], excludeOutputs: [], includeInputs: [], excludeInputs: [], includeEntryPoints: [], excludeEntryPoints: [] })
 * selectArtefacts(stats, { includeOutputs: [], excludeOutputs: [], includeInputs: ['src/main.ts'], excludeInputs: ['test.ts'], includeEntryPoints: [], excludeEntryPoints: [] })
 */
export function selectArtefacts(
  unifiedStats: UnifiedStats,
  selectionOptions: SelectionOptions,
): UnifiedStats {
  const patterns = compileSelectionPatterns(selectionOptions);
  const selectedStats: UnifiedStats = {};

  const entries = Object.entries(unifiedStats);

  for (let i = 0; i < entries.length; i++) {
    const [outputKey, output] = entries[i]!;

    const shouldSelect = shouldSelectOutput(outputKey, output, patterns);

    if (shouldSelect) {
      selectedStats[outputKey] = output;
    }
  }

  return selectedStats;
}
