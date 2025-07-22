import type { AuditOutput } from '@code-pushup/models';
import { executeProcess, readJsonFile } from '@code-pushup/utils';
import { BUNDLE_STATS_PLUGIN_SLUG, DEFAULT_GROUPING } from '../constants.js';
import type { GlobalSelectionOptions, SelectionOptions } from '../types.js';
import { generateAuditOutputs } from './audits/audit-outputs.js';
import type { InsightsConfig } from './audits/details/table.js';
import { DEFAULT_PRUNING_OPTIONS } from './audits/details/tree.js';
import type { ArtefactTreeOptions } from './audits/details/tree.js';
import { DEFAULT_PENALTY, type ScoringConfig } from './audits/utils/scoring.js';
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
  artefactTree?: ArtefactTreeOptions | false;
  insights?: InsightsConfig;
  selection?: GlobalSelectionOptions;
}

/**
 * Validates bundle stats data structure based on bundler type. Ensures stats and required properties are properly defined.
 */
function validateBundleStats(
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
function getUnifyFunction(
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
    artefactTree,
    scoring,
    bundler,
    insights,
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
      insights,
      selection,
      scoring,
      artefactTree,
    });

    const bundleStatsTree = unifiedBundleStats;
    return generateAuditOutputs(bundleStatsTree, mergedAuditConfigs);
  };
}

export function mergeAuditConfigs(
  configs: BundleStatsConfig[],
  options: Pick<
    BundleStatsRunnerOptions,
    'scoring' | 'artefactTree' | 'insights' | 'selection'
  >,
): BundleStatsConfig[] {
  return configs.map(config => {
    // Handle artefactTree merging with proper support for false values
    let mergedArtefactTree: ArtefactTreeOptions | false | undefined;

    if (config.artefactTree === false || options.artefactTree === false) {
      // If either is explicitly false, disable the tree
      mergedArtefactTree = false;
    } else if (options.artefactTree || config.artefactTree) {
      // If either has tree options, merge them
      mergedArtefactTree = {
        groups: [
          ...(config.artefactTree?.groups ?? []),
          ...(options.artefactTree?.groups ?? []),
        ],
        pruning: {
          ...DEFAULT_PRUNING_OPTIONS,
          ...(options.artefactTree?.pruning ?? {}),
          ...(config.artefactTree?.pruning ?? {}),
        },
      };
    } else {
      // If both are undefined, leave as undefined
      mergedArtefactTree = undefined;
    }

    return {
      ...config,
      selection: {
        ...config.selection,
        excludeOutputs: [
          ...(config.selection?.excludeOutputs ?? []),
          ...(options.selection?.['excludeOutputs'] ?? []),
        ],
        excludeInputs: [
          ...(config.selection?.excludeInputs ?? []),
          ...(options.selection?.['excludeInputs'] ?? []),
        ],
        excludeImports: [
          ...(config.selection?.excludeImports ?? []),
          ...(options.selection?.['excludeImports'] ?? []),
        ],
        excludeEntryPoints: [
          ...(config.selection?.excludeEntryPoints ?? []),
          ...(options.selection?.['excludeEntryPoints'] ?? []),
        ],
      },
      scoring: {
        ...options.scoring,
        ...config.scoring,
        ...(config.scoring?.penalty !== false
          ? {
              penalty: {
                ...DEFAULT_PENALTY,
                ...options.scoring?.penalty,
                ...config.scoring?.penalty,
                blacklist: [
                  ...(config.scoring?.penalty?.blacklist ?? []),
                  ...(options.scoring?.penalty !== false
                    ? (options.scoring?.penalty?.blacklist ?? [])
                    : []),
                ],
              },
            }
          : {}),
      },
      artefactTree: mergedArtefactTree,
      ...(config.insights !== false
        ? {
            insights: [
              ...(options.insights ?? []), // Plugin-level insights
              ...(config.insights ?? []), // Audit-level insights (can override)
            ],
          }
        : {}),
    };
  });
}
