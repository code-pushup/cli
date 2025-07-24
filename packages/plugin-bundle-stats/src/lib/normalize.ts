import type { Audit } from '@code-pushup/models';
import { slugify } from '@code-pushup/utils';
import { formatBytes } from '@code-pushup/utils';
import type { BundleStatsConfig as ExportedBundleStatsConfig } from '../index.js';
import type { InsightsTableConfig } from './runner/audits/details/table.js';
import {
  DEFAULT_PRUNING_CONFIG,
  type DependencyTreeConfig,
} from './runner/audits/details/tree.js';
import type { ScoringConfig } from './runner/audits/scoring.js';
import { DEFAULT_PENALTY } from './runner/audits/scoring.js';
import type { SelectionConfig } from './runner/audits/selection.js';
import type { BundleStatsConfig, MinMax } from './runner/types.js';
import type {
  BundleStatsAuditOptions,
  PluginBundleStatsAuditOptions,
  PluginDependencyTreeOptions,
  PluginInsightsTableOptions,
  PluginScoringOptions,
  SelectionGeneralConfig,
  SelectionOptions,
} from './types.js';

function formatSelectionConfig(selection: any): string {
  const items: string[] = [];

  if (selection.includeOutputs?.length > 0) {
    items.push(
      `• \`includeOutputs\`: ${selection.includeOutputs.map((p: string) => `\`${p}\``).join(', ')}`,
    );
  }
  if (selection.excludeOutputs?.length > 0) {
    items.push(
      `• \`excludeOutputs\`: ${selection.excludeOutputs.map((p: string) => `\`${p}\``).join(', ')}`,
    );
  }
  if (selection.includeInputs?.length > 0) {
    items.push(
      `• \`includeInputs\`: ${selection.includeInputs.map((p: string) => `\`${p}\``).join(', ')}`,
    );
  }
  if (selection.excludeInputs?.length > 0) {
    items.push(
      `• \`excludeInputs\`: ${selection.excludeInputs.map((p: string) => `\`${p}\``).join(', ')}`,
    );
  }
  if (selection.includeEntryPoints?.length > 0) {
    items.push(
      `• \`includeEntryPoints\`: ${selection.includeEntryPoints.map((p: string) => `\`${p}\``).join(', ')}`,
    );
  }
  if (selection.excludeEntryPoints?.length > 0) {
    items.push(
      `• \`excludeEntryPoints\`: ${selection.excludeEntryPoints.map((p: string) => `\`${p}\``).join(', ')}`,
    );
  }

  return items.length > 0 ? `**Selection**\n${items.join('\n')}` : '';
}

function formatPenaltyConfig(penalty: any): string {
  const items: string[] = [];

  if (penalty.artefactSize) {
    const [min, max] = penalty.artefactSize;
    items.push(
      `• \`artefactSize\`: \`${formatBytes(min)} – ${formatBytes(max)}\``,
    );
  }
  if (penalty.blacklist?.length > 0) {
    items.push(
      `• \`blacklist\`: ${penalty.blacklist.map((p: string) => `\`${p}\``).join(', ')}`,
    );
  }

  const weights: string[] = [];
  if (penalty.warningWeight !== undefined) {
    weights.push(`warning ×${penalty.warningWeight}`);
  }
  if (penalty.errorWeight !== undefined) {
    weights.push(`error ×${penalty.errorWeight}`);
  }
  if (weights.length > 0) {
    items.push(`• \`weights\`: \`${weights.join(', ')}\``);
  }

  return items.length > 0 ? `**Penalty**\n${items.join('\n')}` : '';
}

function formatArtefactTreeConfig(artefactTree: any): string {
  const items: string[] = [];

  if (artefactTree.groups?.length > 0) {
    items.push(`• \`groups\`: ${artefactTree.groups.length}`);
  }

  const pruningOptions: string[] = [];
  if (artefactTree.pruning?.maxDepth !== undefined) {
    pruningOptions.push(`maxDepth: ${artefactTree.pruning.maxDepth}`);
  }
  if (artefactTree.pruning?.maxChildren !== undefined) {
    pruningOptions.push(`maxChildren: ${artefactTree.pruning.maxChildren}`);
  }
  if (artefactTree.pruning?.startDepth !== undefined) {
    pruningOptions.push(`startDepth: ${artefactTree.pruning.startDepth}`);
  }

  if (pruningOptions.length > 0) {
    items.push(`• \`pruning\`: \`${pruningOptions.join(', ')}\``);
  } else if (artefactTree.pruning !== undefined) {
    items.push(`• \`pruning\`: *(none set)*`);
  }

  return items.length > 0 ? `**Artefact Tree**\n${items.join('\n')}` : '';
}

function formatInsightsConfig(insights: any[]): string {
  const items: string[] = [];

  insights.forEach((insight: any) => {
    const icon = insight.icon || '•';
    const patterns = insight.patterns?.join(', ') || '';
    items.push(`• ${icon} \`${patterns}\``);
  });

  return items.length > 0 ? `**Insights**\n${items.join('\n')}` : '';
}

function formatScoringConfig(totalSize: any, penalty: any): string {
  const items: string[] = [];

  if (totalSize) {
    items.push(
      `• \`totalSize\`: \`${formatBytes(totalSize[0])} – ${formatBytes(totalSize[1])}\``,
    );
  }

  if (penalty && Object.keys(penalty).length > 0) {
    // Add penalty artefact size information
    if (penalty.artefactSize) {
      const [min, max] = penalty.artefactSize;
      items.push(
        `• \`penalty.artefactSize\`: \`${formatBytes(min)} – ${formatBytes(max)}\``,
      );
    }

    // Add penalty blacklist information
    if (penalty.blacklist?.length > 0) {
      items.push(
        `• \`penalty.blacklist\`: ${penalty.blacklist.map((p: string) => `\`${p}\``).join(', ')}`,
      );
    }

    // Add penalty weights
    const penaltyParts: string[] = [];
    if (penalty.warningWeight !== undefined) {
      penaltyParts.push(`warning ×${penalty.warningWeight}`);
    }
    if (penalty.errorWeight !== undefined) {
      penaltyParts.push(`error ×${penalty.errorWeight}`);
    }
    if (penaltyParts.length > 0) {
      items.push(`• \`penalty.weights\`: \`${penaltyParts.join(', ')}\``);
    }
  }

  return items.length > 0 ? `**Scoring**\n${items.join('\n')}` : '';
}

export function cleanTitleForSlug(title: string): string {
  return title
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function prepareDescription(config: BundleStatsConfig): string {
  const {
    description,
    scoring,
    selection,
    dependencyTree: artefactTree,
    insightsTable: insights,
  } = config;
  const { totalSize, penalty } = scoring;

  let enhancedDescription = description || '';

  // Add educational content based on actual configuration
  const configDetails: string[] = [];

  if (
    selection &&
    Object.values(selection).some(
      (arr: any) => Array.isArray(arr) && arr.length > 0,
    )
  ) {
    configDetails.push(formatSelectionConfig(selection));
  }

  const scoringConfig = formatScoringConfig(totalSize, penalty);
  if (scoringConfig) {
    configDetails.push(scoringConfig);
  }

  if (artefactTree && Object.keys(artefactTree).length > 0) {
    configDetails.push(formatArtefactTreeConfig(artefactTree));
  }

  if (insights && insights.length > 0) {
    configDetails.push(formatInsightsConfig(insights));
  }

  if (configDetails.length > 0) {
    const configSection = `<details>
<summary>⚙️ Config Summary</summary>

${configDetails.join('\n\n')}

</details>`;

    enhancedDescription += enhancedDescription
      ? `\n\n${configSection}`
      : configSection;
  }

  return enhancedDescription.trim() || '';
}

/**
 * Converts SelectionGeneralConfig to SelectionOptions by adding default empty arrays.
 */
export function selectionGeneralConfigToOptions(
  config: SelectionGeneralConfig,
): SelectionOptions {
  return {
    ...config,
    includeOutputs: [],
    excludeOutputs: [],
    includeInputs: [],
    excludeInputs: [],
    includeImports: [],
    excludeImports: [],
    includeEntryPoints: [],
    excludeEntryPoints: [],
  };
}

export function normalizeSelectionOptions(
  options: SelectionOptions | undefined,
): SelectionConfig {
  if (options === undefined) {
    return {
      includeOutputs: [],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
      includeImports: [],
      excludeImports: [],
      includeEntryPoints: [],
      excludeEntryPoints: [],
    };
  }

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

export function normalizeBundleStatsOptions(
  auditOptions: BundleStatsAuditOptions,
): BundleStatsConfig {
  const { slug, title, description, scoring, selection, ...restOptions } =
    auditOptions;
  const { penalty, totalSize } = scoring ?? {};

  // Use the proper selection normalization helper that merges global patterns
  const normalizedSelection = normalizeSelectionOptions(selection);

  const normalizedScoring: ScoringConfig = {
    totalSize: normalizeRange(totalSize ?? Infinity),
    penalty: {
      ...(penalty && typeof penalty === 'object' && penalty.artefactSize
        ? { artefactSize: normalizeRange(penalty.artefactSize) }
        : {}),
      ...(penalty && typeof penalty === 'object' && penalty.blacklist
        ? { blacklist: penalty.blacklist }
        : {}),
    },
  };

  const normalizedConfig: BundleStatsConfig = {
    slug: slug ?? slugify(title),
    title,
    description: description || '',
    selection: normalizedSelection,
    scoring: normalizedScoring,
    dependencyTree: restOptions.dependencyTree
      ? {
          groups: restOptions.dependencyTree.groups || [],
          pruning: restOptions.dependencyTree.pruning || DEFAULT_PRUNING_CONFIG,
        }
      : undefined,
    insightsTable: restOptions.insightsTable,
  };

  normalizedConfig.description = prepareDescription(normalizedConfig);

  return normalizedConfig;
}

/**
 * Normalizes scoring options. Converts plugin-level scoring to runner scoring config.
 */
export function normalizeScoringOptions(
  options: PluginScoringOptions | undefined,
): ScoringConfig | undefined {
  if (!options) {
    return undefined;
  }

  const { penalty } = options;

  return {
    totalSize: [0, Infinity], // Default range
    penalty: penalty
      ? {
          ...DEFAULT_PENALTY,
          ...penalty,
          artefactSize: penalty.artefactSize
            ? normalizeRange(penalty.artefactSize)
            : undefined,
        }
      : DEFAULT_PENALTY,
  };
}

/**
 * Normalizes dependency tree options. Converts plugin-level options to runner config.
 */
export function normalizeDependencyTreeOptions(
  options: PluginDependencyTreeOptions | undefined,
): DependencyTreeConfig | undefined {
  if (!options) {
    return undefined;
  }

  return {
    groups: options.groups || [],
    pruning: options.pruning || DEFAULT_PRUNING_CONFIG,
  };
}

/**
 * Normalizes insights table options. Converts plugin-level options to runner config.
 */
export function normalizeInsightsTableOptions(
  options: PluginInsightsTableOptions | false | undefined,
): InsightsTableConfig | undefined {
  if (options === false || options === undefined) {
    return undefined;
  }

  return options;
}

export function normalizeRange(range: MinMax | number): MinMax {
  if (typeof range === 'number') {
    return [0, range];
  }

  return range;
}

export function getAuditsFromConfigs(configs: BundleStatsConfig[]): Audit[] {
  return configs.map(({ slug, title, description }) => {
    return {
      slug,
      title,
      description,
    };
  });
}

/**
 * Normalizes complete plugin options. Centralizes all normalization logic.
 */
export function normalizeBundleStatsAuditOptions(
  auditOptions: BundleStatsAuditOptions[],
  pluginOptions: PluginBundleStatsAuditOptions,
) {
  return {
    bundleStatsConfigs: auditOptions.map(normalizeBundleStatsOptions),
    scoring: normalizeScoringOptions(pluginOptions.scoring),
    dependencyTree: normalizeDependencyTreeOptions(
      pluginOptions.dependencyTree,
    ),
    insightsTable: normalizeInsightsTableOptions(pluginOptions.insightsTable),
    selection: pluginOptions.selection,
  };
}
