import type { AuditOutput } from '@code-pushup/models';
import { executeProcess, formatBytes, readJsonFile } from '@code-pushup/utils';
import type {
  BundleStatsConfig,
  GroupingOptions,
  PruningOptions,
  SupportedBundlers,
} from './types.js';
import type {
  BundleStatsNode,
  BundleStatsTree,
} from './unify/bundle-stats.types.js';
import {
  type EsBuildCoreStats,
  unifyBundlerStats,
} from './unify/unify.esbuild.js';
import {
  createDisplayValue,
  createEmptyAudit,
  filterUnifiedTreeByConfigSingle,
  formatTreeForDisplay,
} from './utils.js';
import {
  type PrunedNode,
  applyGroupingToTree,
  calcTotals,
  formatTree,
  prune,
} from './utils/reduce.js';
import { calculateScore } from './utils/scoring.js';

export type PluginArtefactOptions = {
  generateArtefacts?: {
    command: string;
    args: string[];
  };
  artefactsPath: string;
};

export type BundleStatsRunnerOptions = PluginArtefactOptions & {
  bundler: SupportedBundlers;
  configs: BundleStatsConfig[];
  grouping?: GroupingOptions[];
  pruning?: PruningOptions;
};

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
  const {
    artefactsPath,
    generateArtefacts,
    bundler,
    configs,
    grouping,
    pruning,
  } = opts;

  return async () => {
    if (generateArtefacts) {
      const { command, args } = generateArtefacts;
      await executeProcess({
        command,
        args,
      });
    }

    const stats = await readJsonFile<EsBuildCoreStats>(artefactsPath);
    const unifieBundleStats = unifyBundlerStats(stats, {
      includeDynamicImports: false,
      bundler,
    });

    const bundleStatsTree = unifieBundleStats as unknown as BundleStatsTree;
    return generateAudits(bundleStatsTree, configs, { grouping, pruning });
  };
}

/**
 * Processes a bundle stats tree through the complete analysis pipeline
 */
function processTreeForAudit(
  tree: BundleStatsTree,
  options: { grouping?: GroupingOptions[]; pruning?: PruningOptions },
): { processedTree: PrunedNode; totalBytes: number; fileCount: number } {
  const {
    grouping = [],
    pruning = { maxChildren: 10, startDepth: 0, maxDepth: 2 },
  } = options;

  let processedTree = tree.root;

  // Apply grouping if specified
  if (grouping.length > 0) {
    processedTree = applyGroupingToTree(processedTree, { grouping });
  }

  // Calculate totals
  const rootWithTotals = calcTotals(processedTree);
  const totalBytes = rootWithTotals.values.bytes || 0;
  const fileCount = rootWithTotals.values.childCount || 0;

  // Apply pruning for display
  const prunedRoot = prune(rootWithTotals, pruning);
  const formattedRoot = formatTree(prunedRoot);

  return {
    processedTree: formattedRoot,
    totalBytes,
    fileCount,
  };
}

/**
 * Creates a complete audit output from processed tree data
 */
function createAuditOutput(
  config: BundleStatsConfig,
  processedTree: PrunedNode,
  totalBytes: number,
  fileCount: number,
): AuditOutput {
  // Convert to Tree format for audit details
  const tree = formatTreeForDisplay(processedTree, config.title || config.slug);

  // Calculate score using the existing function
  const score = calculateScore(totalBytes, config);

  // Create display value
  const displayValue = createDisplayValue(totalBytes, fileCount);

  return {
    slug: config.slug,
    score,
    value: totalBytes,
    displayValue,
    details: {
      trees: [tree],
    },
  };
}

/**
 * Generates audit outputs from bundle stats tree and configurations
 */
export function generateAudits(
  bundleStatsTree: BundleStatsTree,
  configs: BundleStatsConfig[],
  options: { grouping?: GroupingOptions[]; pruning?: PruningOptions },
): AuditOutput[] {
  return configs.map(config => {
    const filteredTree = filterUnifiedTreeByConfigSingle(
      bundleStatsTree,
      config,
    );

    if (!filteredTree) {
      return createEmptyAudit(config);
    }

    const { processedTree, totalBytes, fileCount } = processTreeForAudit(
      filteredTree,
      options,
    );

    return createAuditOutput(config, processedTree, totalBytes, fileCount);
  });
}
