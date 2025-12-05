import type { Audit } from '@code-pushup/models';
import { slugify } from '@code-pushup/utils';
import { formatBytes } from '@code-pushup/utils';
import type { BundleStatsConfig as ExportedBundleStatsConfig } from '../index.js';
import type { InsightsTableConfig } from './runner/audits/details/table.js';
import { type DependencyTreeConfig } from './runner/audits/details/tree.js';
import type { PenaltyConfig, ScoringConfig } from './runner/audits/scoring.js';
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

function formatStandardizedScoringSection(scoring: ScoringConfig): string {
  const { totalSize, penalty } = scoring;
  const items: string[] = [];

  // Artefact Size section
  if (penalty && penalty.artefactSize) {
    const [min, max] = penalty.artefactSize;
    const weight = penalty.errorWeight || 0;
    items.push(
      `  - Artefact Size: >\`${formatBytes(min)}\` & <\`${formatBytes(max)}\`; weight: \`${weight}\``,
    );
  }

  // Blacklist section
  if (penalty && penalty.blacklist) {
    const count = penalty.blacklist.length;
    const weight = penalty.errorWeight || 0;
    items.push(`  - Blacklist: \`${count}\` matches; weight: \`${weight}\``);
  }

  // Total Size section (if configured)
  if (totalSize && totalSize[1] !== Infinity) {
    items.push(`  - Total Size: >\`${formatBytes(totalSize[1])}\` threshold`);
  }

  return items.length > 0 ? `- **Scoring:**\n${items.join('\n')}` : '';
}

function formatStandardizedIssuesSection(scoring: ScoringConfig): string {
  const { penalty } = scoring;
  const items: string[] = [];

  if (penalty) {
    // Check if this audit generates issues
    if (penalty.blacklist && penalty.blacklist.length > 0) {
      items.push(
        `  - Error: \`1+\` candidates - Violation detected, requires action`,
      );
      items.push(`  - Info: \`0\` candidates - No violations found`);
    } else if (penalty.artefactSize) {
      const [, max] = penalty.artefactSize;
      items.push(
        `  - Warning: <\`${formatBytes(max)}\` - Size acceptable but monitor growth`,
      );
      items.push(`  - Error: >\`${formatBytes(max)}\` - Exceeds size budget`);
    } else {
      items.push(`  - Info: \`0\` violations - Analysis only, no penalties`);
    }
  } else {
    items.push(`  - Info: \`0\` violations - Analysis only, no penalties`);
  }

  return `- **Issues:**\n${items.join('\n')}`;
}

function formatStandardizedTableSection(
  insightsTable: InsightsTableConfig | undefined,
): string {
  if (
    !insightsTable ||
    !insightsTable.groups ||
    insightsTable.groups.length === 0
  ) {
    return ''; // Hide empty table section
  }

  const groupItems = insightsTable.groups
    .filter(group => group.title)
    .map(group => `*${group.icon || ''}${group.title}*`)
    .slice(0, 5); // Limit to prevent overly long descriptions

  const groupsText =
    groupItems.length > 0
      ? `Detail listing of ${groupItems.join(', ')}`
      : 'Configured groups';

  return `- **Table:**\n  - Groups: ${groupsText}\n  - Rest: Other contributing modules`;
}

function formatStandardizedTreeSection(
  dependencyTree: DependencyTreeConfig | undefined,
): string {
  if (!dependencyTree) {
    return ''; // Hide disabled tree section
  }

  const { pruning, groups, mode } = dependencyTree;

  // Format pruning settings
  let pruningText = 'Default settings';
  if (pruning) {
    const pruningParts: string[] = [];
    if (pruning.minSize)
      pruningParts.push(`Min size: \`${formatBytes(pruning.minSize)}\``);
    if (pruning.maxChildren)
      pruningParts.push(`Max children: \`${pruning.maxChildren}\``);
    if (pruning.maxDepth)
      pruningParts.push(`Max depth: \`${pruning.maxDepth}\``);
    if (pruning.pathLength)
      pruningParts.push(`Path length: \`${pruning.pathLength}\``);

    if (pruningParts.length > 0) {
      pruningText = pruningParts.join(', ');
    }
  }

  // Format groups
  let groupsText = 'None';
  if (groups && groups.length > 0) {
    const groupSummaries = groups.map(group => {
      const parts: string[] = [];
      if (group.title) parts.push(`"${group.title}"`);
      if (group.icon) parts.push(`${group.icon}`);
      if (group.includeInputs) {
        if (Array.isArray(group.includeInputs)) {
          const includePatterns = group.includeInputs
            .slice(0, 2)
            .map((p: string) => `"${p}"`)
            .join(', ');
          const moreCount =
            group.includeInputs.length > 2
              ? `, +${group.includeInputs.length - 2} more`
              : '';
          parts.push(`include: [${includePatterns}${moreCount}]`);
        } else {
          parts.push(`include: "${group.includeInputs}"`);
        }
      }
      if (
        group.excludeInputs &&
        (typeof group.excludeInputs === 'string'
          ? [group.excludeInputs]
          : group.excludeInputs
        ).length > 0
      ) {
        const excludeArray =
          typeof group.excludeInputs === 'string'
            ? [group.excludeInputs]
            : group.excludeInputs;
        const excludePatterns = excludeArray
          .slice(0, 1)
          .map((p: string) => `"${p}"`)
          .join(', ');
        const moreCount =
          excludeArray.length > 1 ? `, +${excludeArray.length - 1} more` : '';
        parts.push(`exclude: [${excludePatterns}${moreCount}]`);
      }
      return parts.join(' ');
    });
    groupsText = groupSummaries.join('; ');
  }

  // Format mode
  const modeText = mode || 'onlyMatching';

  return `- **Tree:**\n  - Mode: \`${modeText}\`\n  - Groups: ${groupsText}\n  - Pruning: ${pruningText}`;
}

function formatStandardizedSelectionSection(
  selection: SelectionConfig,
): string {
  const items: string[] = [];

  // Selection mode
  items.push(`  - Mode: \`${selection.mode}\``);

  // Output patterns
  if (selection.includeOutputs.length > 0) {
    const patterns = selection.includeOutputs
      .slice(0, 3)
      .map(p => `\`${p}\``)
      .join(', ');
    const extra =
      selection.includeOutputs.length > 3
        ? ` (+${selection.includeOutputs.length - 3} more)`
        : '';
    items.push(`  - Include Outputs: ${patterns}${extra}`);
  }

  if (selection.excludeOutputs.length > 0) {
    const patterns = selection.excludeOutputs
      .slice(0, 2)
      .map(p => `\`${p}\``)
      .join(', ');
    const extra =
      selection.excludeOutputs.length > 2
        ? ` (+${selection.excludeOutputs.length - 2} more)`
        : '';
    items.push(`  - Exclude Outputs: ${patterns}${extra}`);
  }

  // Input patterns
  if (selection.includeInputs.length > 0) {
    const patterns = selection.includeInputs
      .slice(0, 3)
      .map(p => `\`${p}\``)
      .join(', ');
    const extra =
      selection.includeInputs.length > 3
        ? ` (+${selection.includeInputs.length - 3} more)`
        : '';
    items.push(`  - Include Inputs: ${patterns}${extra}`);
  }

  if (selection.excludeInputs.length > 0) {
    const patterns = selection.excludeInputs
      .slice(0, 2)
      .map(p => `\`${p}\``)
      .join(', ');
    const extra =
      selection.excludeInputs.length > 2
        ? ` (+${selection.excludeInputs.length - 2} more)`
        : '';
    items.push(`  - Exclude Inputs: ${patterns}${extra}`);
  }

  return `- **Selection:**\n${items.join('\n')}`;
}

export function cleanTitleForSlug(title: string): string {
  return title
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function prepareDescription(config: BundleStatsConfig): string {
  const { description, scoring, selection, dependencyTree, insightsTable } =
    config;

  // Start with the action paragraph (preserve existing custom descriptions)
  let enhancedDescription = description || '';

  // Only add standardized sections if we have a custom description
  if (enhancedDescription.trim()) {
    const sections: string[] = [];

    // Add standardized sections
    const scoringSection = formatStandardizedScoringSection(scoring);
    if (scoringSection) sections.push(scoringSection);

    const issuesSection = formatStandardizedIssuesSection(scoring);
    if (issuesSection) sections.push(issuesSection);

    const selectionSection = formatStandardizedSelectionSection(selection);
    if (selectionSection) sections.push(selectionSection);

    // Handle insightsTable which could be false
    const normalizedInsightsTable =
      insightsTable === false ? undefined : insightsTable;
    const tableSection = formatStandardizedTableSection(
      normalizedInsightsTable,
    );
    if (tableSection) sections.push(tableSection);

    const treeSection = formatStandardizedTreeSection(dependencyTree);
    if (treeSection) sections.push(treeSection);

    // Wrap config sections in details if any exist
    if (sections.length > 0) {
      const configContent = sections.join('\n\n');
      enhancedDescription += `\n\n<details>\n<summary>⚙️ Configuration</summary>\n\n${configContent}\n\n</details>`;
    }
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
    mode: 'withStartupDeps',
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
    // Default: include all outputs for startup mode
    return {
      mode: 'withStartupDeps',
      includeOutputs: ['**/*'],
      excludeOutputs: [],
      includeInputs: [],
      excludeInputs: [],
    };
  }

  const globalInclude = options.include || [];
  const globalExclude = options.exclude || [];

  return {
    mode: options.mode || 'withStartupDeps',
    includeOutputs: [...(options.includeOutputs || []), ...globalInclude],
    excludeOutputs: [...(options.excludeOutputs || []), ...globalExclude],
    includeInputs: [...(options.includeInputs || []), ...globalInclude],
    excludeInputs: [...(options.excludeInputs || []), ...globalExclude],
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

  let normalizedPenalty: false | PenaltyConfig | undefined = undefined;
  if (penalty && typeof penalty === 'object') {
    const { artefactSize, ...restPenalty } = penalty;
    normalizedPenalty = {
      ...restPenalty, // Preserve all penalty properties including warningWeight, errorWeight
      ...(artefactSize ? { artefactSize: normalizeRange(artefactSize) } : {}),
    } as PenaltyConfig;
  }

  const normalizedScoring: ScoringConfig = {
    mode: 'matchingWithStaticImports',
    totalSize: normalizeRange(totalSize ?? Infinity),
    penalty: normalizedPenalty,
  };

  const normalizedConfig: BundleStatsConfig = {
    slug: slug ?? slugify(title),
    title,
    description: description || '',
    selection: normalizedSelection,
    scoring: normalizedScoring,
    dependencyTree: restOptions.dependencyTree,
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
    mode: 'matchingWithStaticImports',
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
 * Normalizes dependency tree options from plugin configuration.
 * Groups array overwrites, pruning merges with defaults.
 */
export function normalizeDependencyTreeOptions(
  options: PluginDependencyTreeOptions | undefined,
): DependencyTreeConfig {
  return {
    groups: options?.groups ?? [],
    pruning: {
      maxDepth: 2,
      maxChildren: 10,
      minSize: 1000,
      pathLength: 60,
      ...(options?.pruning ?? {}),
    },
    mode: options?.mode ?? 'onlyMatching',
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

  return {
    mode: options.mode || 'onlyMatching',
    groups: options.groups || [],
    pruning: options.pruning
      ? {
          enabled: options.pruning.enabled ?? false,
          maxChildren: options.pruning.maxChildren,
          minSize: options.pruning.minSize,
        }
      : undefined,
  };
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
