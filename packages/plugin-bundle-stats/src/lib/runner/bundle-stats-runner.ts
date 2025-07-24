import type { AuditOutput, PluginArtifactOptions } from '@code-pushup/models';
import { executeProcess, readJsonFile } from '@code-pushup/utils';
import { normalizeRange } from '../normalize.js';
import type {
  PluginDependencyTreeOptions,
  PluginInsightsTableOptions,
  PluginScoringOptions,
  PluginSelectionOptions,
} from '../types.js';
import { generateAuditOutputs } from './audits/audit-outputs.js';
import type { InsightsTableConfig } from './audits/details/table.js';
import { DEFAULT_PRUNING_CONFIG } from './audits/details/tree.js';
import type { DependencyTreeConfig } from './audits/details/tree.js';
import { DEFAULT_PENALTY } from './audits/scoring.js';
import type { SelectionConfig } from './audits/selection.js';
import type { BundleStatsConfig, SupportedBundlers } from './types.js';
import type { UnifiedStats } from './unify/unified-stats.types.js';
import { unifyBundlerStats as unifyEsbuildStats } from './unify/unify.esbuild.js';
import { unifyBundlerStats as unifyRsbuildStats } from './unify/unify.rsbuild.js';
import { unifyBundlerStats as unifyViteStats } from './unify/unify.vite.js';
import { unifyBundlerStats as unifyWebpackStats } from './unify/unify.webpack.js';

export interface BundleStatsRunnerConfig extends PluginArtifactOptions {
  bundler: SupportedBundlers;
  bundleStatsConfigs: BundleStatsConfig[];
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
 * Merges dependency tree configurations from audit and plugin levels.
 *
 * @param auditConfig - Individual audit tree configuration
 * @param pluginOptions - Global plugin tree configuration
 * @returns Merged configuration or false/undefined for disabled states
 */
export function mergeDependencyTreeConfig(
  auditConfig: DependencyTreeConfig | undefined,
  pluginOptions: PluginDependencyTreeOptions | undefined,
): DependencyTreeConfig | undefined {
  // Only hide if audit config explicitly disables
  if (auditConfig?.enabled === false) {
    return undefined;
  }

  // If global options exist, always show them (unless disabled above)
  if (pluginOptions) {
    return {
      // Groups merge - users often want to layer groups
      groups: [
        ...(pluginOptions?.groups ?? []),
        ...(auditConfig?.groups ?? []),
      ],
      // Pruning overwrites - only one pruning strategy should apply (shallow merge ok)
      pruning: {
        ...DEFAULT_PRUNING_CONFIG,
        ...(pluginOptions?.pruning ?? {}),
        ...(auditConfig?.pruning ?? {}),
      },
    };
  }

  // If no global options but config exists, use config
  if (auditConfig) {
    return {
      groups: auditConfig?.groups ?? [],
      pruning: {
        ...DEFAULT_PRUNING_CONFIG,
        ...(auditConfig?.pruning ?? {}),
      },
    };
  }

  return undefined;
}

/**
 * Merges selection configurations with hybrid strategy. Excludes merge for safety, includes overwrite for scope clarity.
 */
export function mergeSelectionConfig(
  auditConfig: SelectionConfig | undefined,
  pluginOptions?: PluginSelectionOptions,
): SelectionConfig {
  return {
    // Include arrays overwrite - config takes precedence for scope clarity
    includeOutputs: auditConfig?.includeOutputs ?? [],
    includeInputs: auditConfig?.includeInputs ?? [],
    includeImports: auditConfig?.includeImports ?? [],
    includeEntryPoints: auditConfig?.includeEntryPoints ?? [],

    // Exclude arrays merge - merging exclusions is safe and expected
    excludeOutputs: [
      ...(pluginOptions?.excludeOutputs ?? []),
      ...(auditConfig?.excludeOutputs ?? []),
    ],
    excludeInputs: [
      ...(pluginOptions?.excludeInputs ?? []),
      ...(auditConfig?.excludeInputs ?? []),
    ],
    excludeImports: [
      ...(pluginOptions?.excludeImports ?? []),
      ...(auditConfig?.excludeImports ?? []),
    ],
    excludeEntryPoints: [
      ...(pluginOptions?.excludeEntryPoints ?? []),
      ...(auditConfig?.excludeEntryPoints ?? []),
    ],
  };
}

/**
 * Merges scoring configurations with hybrid strategy. Penalty blacklist merges to combine blocked patterns.
 */
export function mergeScoringConfig(
  auditConfig: BundleStatsConfig['scoring'] | undefined,
  pluginOptions: PluginScoringOptions | undefined,
): BundleStatsConfig['scoring'] {
  if (auditConfig?.penalty === false) {
    return auditConfig;
  }

  if (!auditConfig) {
    return pluginOptions as BundleStatsConfig['scoring'];
  }

  const pluginPenalty = pluginOptions?.penalty;
  const normalizedPluginPenalty = pluginPenalty
    ? {
        ...pluginPenalty,
        artefactSize: pluginPenalty.artefactSize
          ? normalizeRange(pluginPenalty.artefactSize)
          : undefined,
      }
    : undefined;

  return {
    ...auditConfig,
    penalty: {
      ...DEFAULT_PENALTY,
      ...normalizedPluginPenalty,
      ...auditConfig?.penalty,
      // Blacklist merges - combine blocked patterns from both sources
      blacklist: [
        ...(normalizedPluginPenalty?.blacklist ?? []),
        ...(auditConfig?.penalty?.blacklist ?? []),
      ],
    },
  };
}

/**
 * Merges insights configurations with hybrid strategy. Plugin-level provides broad insights, audit-level adds specifics.
 */
export function mergeInsightsConfig(
  auditConfig: InsightsTableConfig | false | undefined,
  pluginOptions: InsightsTableConfig | undefined,
): InsightsTableConfig | false | undefined {
  if (auditConfig === false) {
    return undefined;
  }

  // Insights merge - plugin-level defines broad insights, audits add specifics
  return [...(pluginOptions ?? []), ...(auditConfig ?? [])];
}

/**
 * Creates a bundle stats audit runner that processes bundler output and generates audit results.
 * Supports multiple bundlers (esbuild, webpack, rsbuild) with dynamic module loading.
 */
export async function bundleStatsRunner(
  opts: BundleStatsRunnerConfig,
): Promise<() => Promise<AuditOutput[]>> {
  const {
    artifactsPaths,
    generateArtifactsCommand,
    bundleStatsConfigs,
    bundler,
  } = opts;

  return async () => {
    if (artifactsPaths && generateArtifactsCommand) {
      const { command, args } =
        typeof generateArtifactsCommand === 'string'
          ? { command: generateArtifactsCommand, args: undefined }
          : generateArtifactsCommand;
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

    if (Array.isArray(artifactsPaths)) {
      throw new Error(
        'The bundle stats plugin does not support multiple artifact paths. Request feature on GitHub.',
      );
    }

    const stats = await readJsonFile(artifactsPaths);
    // @TODO implement zod schema
    validateBundleStats(stats, artifactsPaths, bundler);

    const unifyBundlerStats = getUnifyFunction(bundler);
    const unifiedBundleStats = unifyBundlerStats(stats);

    const bundleStatsTree = unifiedBundleStats;
    return generateAuditOutputs(bundleStatsTree, bundleStatsConfigs);
  };
}

export function mergeAuditConfigs(
  configs: BundleStatsConfig[],
  options: {
    dependencyTree?: PluginDependencyTreeOptions;
    selection?: PluginSelectionOptions;
    scoring?: PluginScoringOptions;
    insightsTable?: PluginInsightsTableOptions;
  },
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
