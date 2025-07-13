import type { AuditOutput } from '@code-pushup/models';
import { executeProcess, readJsonFile } from '@code-pushup/utils';
import { DEFAULT_GROUPING, DEFAULT_PRUNING } from '../constants.js';
import { generateAuditOutputs } from './audits/audit-outputs.js';
import { DEFAULT_PENALTY, type ScoringConfig } from './audits/scoring.js';
import type { InsightsConfig } from './audits/table.js';
import type { ArtefactTreeOptions } from './audits/tree.js';
import type { BundleStatsConfig } from './types.js';
import {
  type EsBuildCoreStats,
  unifyBundlerStats,
} from './unify/unify.esbuild.js';

export type PluginArtefactOptions = {
  generateArtefacts?: {
    command: string;
    args: string[];
  };
  artefactsPath: string;
};

export interface BundleStatsRunnerOptions extends PluginArtefactOptions {
  audits: BundleStatsConfig[];
  scoring?: Pick<ScoringConfig, 'penalty'>;
  artefactTree?: ArtefactTreeOptions;
  insights?: InsightsConfig;
}

/**
 * Validates bundle stats data structure. Ensures stats and outputs are properly defined.
 */
function validateBundleStats(
  stats: unknown,
  artefactsPath: string,
): asserts stats is EsBuildCoreStats {
  if (!stats) {
    throw new Error(`Bundle stats file is null or undefined: ${artefactsPath}`);
  }

  if (typeof stats !== 'object' || !('outputs' in stats)) {
    throw new Error(
      `Bundle stats file has invalid structure: ${artefactsPath}`,
    );
  }

  if (!stats.outputs) {
    throw new Error(
      `Bundle stats outputs is null or undefined in file: ${artefactsPath}`,
    );
  }
}

/**
 * Creates a bundle stats audit runner that processes bundler output and generates audit results
 *
 * @param opts - Configuration options for the bundle stats runner
 * @param opts.artefact - Path to the bundler stats file (JSON)
 * @param opts.bundler - Type of bundler that generated the stats ('esbuild', 'webpack', or 'rsbuild')
 * @param opts.configs - Array of bundle analysis configurations
 * @returns Promise that resolves to a function that returns audit output when called
 *
 * @example
 * ```typescript
 * const runner = await bundleStatsRunner({
 *   artefact: 'dist/stats.json',
 *   bundler: 'webpack',
 *   configs: [
 *     {
 *       name: 'main-bundle',
 *       include: ['src/**'],
 *       thresholds: { totalSize: 1024 * 1024 } // 1MB
 *     }
 *   ]
 * });
 *
 * const auditResults = await runner();
 * ```
 */
export async function bundleStatsRunner(
  opts: BundleStatsRunnerOptions,
): Promise<() => Promise<AuditOutput[]>> {
  const { artefactsPath, generateArtefacts, audits, artefactTree, scoring } =
    opts;

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

    const stats = await readJsonFile<EsBuildCoreStats>(artefactsPath);

    validateBundleStats(stats, artefactsPath);

    const unifieBundleStats = unifyBundlerStats(stats);

    const mergedAuditConfigs = mergeAuditConfigs(audits, {
      scoring,
      artefactTree,
    });

    const bundleStatsTree = unifieBundleStats;
    return generateAuditOutputs(bundleStatsTree, mergedAuditConfigs);
  };
}

export function mergeAuditConfigs(
  configs: BundleStatsConfig[],
  options: Pick<
    BundleStatsRunnerOptions,
    'scoring' | 'artefactTree' | 'insights'
  >,
): BundleStatsConfig[] {
  return configs.map(config => {
    const mergedArtefactTree: ArtefactTreeOptions | undefined =
      options.artefactTree || config.artefactTree
        ? {
            groups: [
              // Only include default grouping if no explicit groups are provided
              ...(config.artefactTree?.groups?.length ||
              options.artefactTree?.groups?.length
                ? []
                : DEFAULT_GROUPING),
              ...(config.artefactTree?.groups ?? []),
              ...(options.artefactTree?.groups ?? []),
            ],
            pruning: {
              ...DEFAULT_PRUNING,
              ...(options.artefactTree?.pruning ?? {}),
              ...(config.artefactTree?.pruning ?? {}),
            },
          }
        : undefined;

    return {
      ...config,
      scoring: {
        ...options.scoring,
        ...config.scoring,
        penalty: {
          ...DEFAULT_PENALTY,
          ...options.scoring?.penalty,
          ...config.scoring?.penalty,
        },
      },
      artefactTree: mergedArtefactTree,
    };
  });
}
