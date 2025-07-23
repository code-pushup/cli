import type { AuditOutput } from '@code-pushup/models';
import { executeProcess, readJsonFile } from '@code-pushup/utils';
import type { GlobalSelectionOptions, SelectionOptions } from '../types.js';
import { generateAuditOutputs } from './audits/audit-outputs.js';
import type { InsightsConfig } from './audits/details/table.js';
import { DEFAULT_PRUNING_OPTIONS } from './audits/details/tree.js';
import type {
  AuditTreeOptions,
  DependencyTreeOptions,
} from './audits/details/tree.js';
import { DEFAULT_PENALTY, type ScoringConfig } from './audits/scoring.js';
import { type SelectionConfig } from './audits/selection.js';
import type { BundleStatsConfig, SupportedBundlers } from './types.js';
import type { UnifiedStats } from './unify/unified-stats.types.js';
import { unifyBundlerStats as unifyEsbuildStats } from './unify/unify.esbuild.js';
import { unifyBundlerStats as unifyRsbuildStats } from './unify/unify.rsbuild.js';
import { unifyBundlerStats as unifyViteStats } from './unify/unify.vite.js';
import { unifyBundlerStats as unifyWebpackStats } from './unify/unify.webpack.js';

export type PluginArtefactOptions = {
  generateArtefacts?: {
    command: string;
    args: string[];
  };
  artefactsPath: string;
  bundler: SupportedBundlers;
};

export interface BundleStatsRunnerOptions extends PluginArtefactOptions {
  audits: BundleStatsConfig[];
  scoring?: Pick<ScoringConfig, 'penalty'>;
  dependencyTree?: DependencyTreeOptions | false;
  insightsTable?: InsightsConfig;
  selection?: GlobalSelectionOptions;
}

/**
 * Validates bundle stats data structure based on bundler type. Ensures stats and required properties are properly defined.
 */
export function validateBundleStats(
  stats: unknown,
  artefactsPath: string,
  bundler: SupportedBundlers,
): void {
  if (!stats) {
    throw new Error(`Bundle stats file is null or undefined: ${artefactsPath}`);
  }

  if (typeof stats !== 'object') {
    throw new Error(
      `Bundle stats file has invalid structure: ${artefactsPath}`,
    );
  }

  switch (bundler) {
    case 'esbuild':
      if (!('outputs' in stats)) {
        throw new Error(
          `Bundle stats file missing 'outputs' property for esbuild: ${artefactsPath}`,
        );
      }
      if (!stats.outputs) {
        throw new Error(
          `Bundle stats outputs is null or undefined in file: ${artefactsPath}`,
        );
      }
      break;
    case 'webpack':
      if (
        !('assets' in stats) ||
        !('chunks' in stats) ||
        !('modules' in stats)
      ) {
        throw new Error(
          `Bundle stats file missing required webpack properties (assets, chunks, modules): ${artefactsPath}`,
        );
      }
      break;
    case 'rsbuild':
      if (
        !('assets' in stats) ||
        !('chunks' in stats) ||
        !('modules' in stats)
      ) {
        throw new Error(
          `Bundle stats file missing required rsbuild properties (assets, chunks, modules): ${artefactsPath}`,
        );
      }
      break;
    case 'vite':
      if (!('assets' in stats) || !('chunks' in stats)) {
        throw new Error(
          `Bundle stats file missing required vite properties (assets, chunks): ${artefactsPath}`,
        );
      }
      break;
    default:
      throw new Error(`Unsupported bundler: ${bundler}`);
  }
}

/**
 * Returns the appropriate unify function based on bundler type. Provides bundler-specific stats processing.
 */
export function getUnifyFunction(
  bundler: SupportedBundlers,
): (stats: any) => UnifiedStats {
  switch (bundler) {
    case 'esbuild':
      return unifyEsbuildStats;
    case 'webpack':
      return unifyWebpackStats;
    case 'rsbuild':
      return unifyRsbuildStats;
    case 'vite':
      return unifyViteStats;
    default:
      throw new Error(`Unsupported bundler: ${bundler}`);
  }
}

/**
 * Merges artefact tree configurations with user-friendly handling.
 *
 * Supports these usage patterns:
 * - `dependencyTree: {}` → Enabled with defaults
 * - `dependencyTree: { enabled: false }` → Explicitly disabled
 * - `dependencyTree: undefined` → No tree (inherited from global)
 * - `dependencyTree: false` → Completely disabled
 *
 * @param configTree - Individual audit tree configuration
 * @param optionsTree - Global plugin tree configuration
 * @returns Merged configuration or false/undefined for disabled states
 */
export function mergeDependencyTreeConfig(
  configTree: AuditTreeOptions | undefined,
  optionsTree: DependencyTreeOptions | false | undefined,
): DependencyTreeOptions | undefined {
  // Only hide if audit config explicitly disables
  if (configTree?.enabled === false) {
    return undefined;
  }

  // If global options exist, always show them (unless disabled above)
  if (optionsTree) {
    return {
      // Groups merge - users often want to layer groups
      groups: [...(optionsTree?.groups ?? []), ...(configTree?.groups ?? [])],
      // Pruning overwrites - only one pruning strategy should apply (shallow merge ok)
      pruning: {
        ...DEFAULT_PRUNING_OPTIONS,
        ...(optionsTree?.pruning ?? {}),
        ...(configTree?.pruning ?? {}),
      },
    };
  }

  // If no global options but config exists, use config
  if (configTree) {
    return {
      groups: [...(configTree?.groups ?? [])],
      pruning: {
        ...DEFAULT_PRUNING_OPTIONS,
        ...(configTree?.pruning ?? {}),
      },
    };
  }

  // Neither global nor config options exist
  return undefined;
}

/**
 * Merges selection configurations with hybrid strategy. Excludes merge for safety, includes overwrite for scope clarity.
 */
export function mergeSelectionConfig(
  configSelection: SelectionOptions | undefined,
  optionsSelection: GlobalSelectionOptions | undefined,
): SelectionConfig {
  return {
    // Include arrays overwrite - config takes precedence for scope clarity
    includeOutputs: configSelection?.includeOutputs ?? [],
    includeInputs: configSelection?.includeInputs ?? [],
    includeImports: configSelection?.includeImports ?? [],
    includeEntryPoints: configSelection?.includeEntryPoints ?? [],

    // Exclude arrays merge - merging exclusions is safe and expected
    excludeOutputs: [
      ...(optionsSelection?.['excludeOutputs'] ?? []),
      ...(configSelection?.excludeOutputs ?? []),
    ],
    excludeInputs: [
      ...(optionsSelection?.['excludeInputs'] ?? []),
      ...(configSelection?.excludeInputs ?? []),
    ],
    excludeImports: [
      ...(optionsSelection?.['excludeImports'] ?? []),
      ...(configSelection?.excludeImports ?? []),
    ],
    excludeEntryPoints: [
      ...(optionsSelection?.['excludeEntryPoints'] ?? []),
      ...(configSelection?.excludeEntryPoints ?? []),
    ],
  };
}

/**
 * Merges scoring configurations with hybrid strategy. Penalty blacklist merges to combine blocked patterns.
 */
export function mergeScoringConfig(
  configScoring: BundleStatsConfig['scoring'] | undefined,
  optionsScoring: Pick<ScoringConfig, 'penalty'> | undefined,
): BundleStatsConfig['scoring'] {
  if (configScoring?.penalty === false) {
    return configScoring;
  }

  if (!configScoring) {
    return optionsScoring as BundleStatsConfig['scoring'];
  }

  return {
    ...configScoring,
    penalty: {
      ...DEFAULT_PENALTY,
      ...optionsScoring?.penalty,
      ...configScoring?.penalty,
      // Blacklist merges - combine blocked patterns from both sources
      blacklist: [
        ...(optionsScoring?.penalty !== false
          ? (optionsScoring?.penalty?.blacklist ?? [])
          : []),
        ...(configScoring?.penalty?.blacklist ?? []),
      ],
    },
  };
}

/**
 * Merges insights configurations with hybrid strategy. Plugin-level provides broad insights, audit-level adds specifics.
 */
export function mergeInsightsConfig(
  configInsights: InsightsConfig | false | undefined,
  optionsInsights: InsightsConfig | undefined,
): InsightsConfig | false | undefined {
  if (configInsights === false) {
    return undefined;
  }

  // Insights merge - plugin-level defines broad insights, audits add specifics
  return [...(optionsInsights ?? []), ...(configInsights ?? [])];
}

/**
 * Creates a bundle stats audit runner that processes bundler output and generates audit results.
 * Supports multiple bundlers (esbuild, webpack, rsbuild) with dynamic module loading.
 */
export async function bundleStatsRunner(
  opts: BundleStatsRunnerOptions,
): Promise<() => Promise<AuditOutput[]>> {
  const {
    artefactsPath,
    generateArtefacts,
    audits,
    dependencyTree,
    scoring,
    bundler,
    insightsTable,
    selection,
  } = opts;

  return async () => {
    if (generateArtefacts) {
      const { command, args } = generateArtefacts;
      try {
        await executeProcess({
          command,
          args,
        });
      } catch (error) {
        throw new Error(
          `Failed to generate artefacts for plugin bundle-stats. command: ${command} args: ${args} error: ${error}`,
        );
      }
    }

    const stats = await readJsonFile(artefactsPath);
    // @TODO implement zod schema
    validateBundleStats(stats, artefactsPath, bundler);

    const unifyBundlerStats = getUnifyFunction(bundler);
    const unifiedBundleStats = unifyBundlerStats(stats);

    const mergedAuditConfigs = mergeAuditConfigs(audits, {
      insightsTable,
      selection,
      scoring,
      dependencyTree,
    });

    const bundleStatsTree = unifiedBundleStats;
    return generateAuditOutputs(bundleStatsTree, mergedAuditConfigs);
  };
}

export function mergeAuditConfigs(
  configs: BundleStatsConfig[],
  options: Pick<
    BundleStatsRunnerOptions,
    'scoring' | 'dependencyTree' | 'insightsTable' | 'selection'
  >,
): BundleStatsConfig[] {
  return configs.map(config => {
    const { insightsTable: configInsights, ...configWithoutInsights } = config;

    return {
      ...configWithoutInsights,
      dependencyTree: mergeDependencyTreeConfig(
        config.dependencyTree,
        options.dependencyTree,
      ),
      selection: mergeSelectionConfig(config.selection, options.selection),
      scoring: mergeScoringConfig(config.scoring, options.scoring),
      ...(configInsights !== false
        ? {
            insightsTable: mergeInsightsConfig(
              configInsights,
              options.insightsTable,
            ),
          }
        : {}),
    };
  });
}
