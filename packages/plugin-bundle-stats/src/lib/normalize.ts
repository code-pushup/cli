import type { Audit } from '@code-pushup/models';
import { slugify } from '@code-pushup/utils';
import { formatBytes } from '@code-pushup/utils';
import type { ScoringConfig } from './runner/audits/scoring.js';
import type { BundleStatsConfig, MinMax } from './runner/types.js';
import type { BundleStatsOptions } from './types.js';

/**
 * Formats selection configuration as compact bullet points.
 */
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

/**
 * Formats penalty configuration as compact bullet points.
 */
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

/**
 * Formats artefact tree configuration as compact bullet points.
 */
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

/**
 * Formats insights configuration as compact bullet points.
 */
function formatInsightsConfig(insights: any[]): string {
  const items: string[] = [];

  insights.forEach((insight: any) => {
    const icon = insight.icon || '•';
    const patterns = insight.patterns?.join(', ') || '';
    items.push(`• ${icon} \`${patterns}\``);
  });

  return items.length > 0 ? `**Insights**\n${items.join('\n')}` : '';
}

/**
 * Formats scoring configuration as compact bullet points.
 */
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

/**
 * Cleans a title for slug generation by removing emojis and special characters. Ensures valid slug format for audit identification.
 */
export function cleanTitleForSlug(title: string): string {
  return title
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * Prepares audit description by combining user description with auto-generated technical details.
 * Enhances descriptions with educational content, selection options, and scoring configuration.
 */
export function prepareDescription(config: BundleStatsConfig): string {
  const { description, scoring, selection, artefactTree, insights } = config;
  const { totalSize, penalty } = scoring;

  let enhancedDescription = description || '';

  // Add educational content based on actual configuration
  const configDetails: string[] = [];

  if (selection && Object.values(selection).some(arr => arr.length > 0)) {
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
export function normalizeBundleStatsOptions(
  options: BundleStatsOptions,
): BundleStatsConfig {
  const { slug, title, description, scoring, selection, ...restOptions } =
    options;
  const { penalty, totalSize } = scoring ?? { penalty: false };

  // Provide defaults for selection options
  const normalizedSelection = {
    includeOutputs: selection?.includeOutputs || [],
    excludeOutputs: selection?.excludeOutputs || [],
    includeInputs: selection?.includeInputs || [],
    excludeInputs: selection?.excludeInputs || [],
    includeEntryPoints: selection?.includeEntryPoints || [],
    excludeEntryPoints: selection?.excludeEntryPoints || [],
  };

  const normalizedScoring: ScoringConfig = {
    totalSize: normalizeRange(totalSize ?? Infinity),
    penalty: {
      ...(penalty && penalty.artefactSize
        ? { artefactSize: normalizeRange(penalty.artefactSize) }
        : {}),
      ...(penalty && penalty.blacklist ? { blacklist: penalty.blacklist } : {}),
    },
  };

  const normalizedConfig: BundleStatsConfig = {
    slug: slug ?? slugify(title),
    title,
    description: description || '', // Include original description
    selection: normalizedSelection,
    scoring: normalizedScoring,
    artefactTree: restOptions.artefactTree,
    insights: restOptions.insights,
    ...restOptions,
  };

  normalizedConfig.description = prepareDescription(normalizedConfig);

  return normalizedConfig;
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
