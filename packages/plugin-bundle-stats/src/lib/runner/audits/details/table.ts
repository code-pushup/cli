import type { Table } from '@code-pushup/models';
import { formatBytes } from '@code-pushup/utils';
import type { GroupingRule } from '../../types.js';
import type { UnifiedStats } from '../../unify/unified-stats.types.js';
import { DEFAULT_GROUP_NAME, REST_GROUP_NAME } from './constants.js';
import {
  createGroupManager,
  findMatchingRule,
  generateGroupKey,
} from './utils/grouping.js';
import type { GroupData } from './utils/grouping.js';

export type InsightsConfig = GroupingRule[];

/**
 * Formats group title with optional icon prefix. Provides consistent display formatting for table entries.
 */
export function formatEntryPoint(title: string, icon?: string): string {
  return icon ? `${icon} ${title}` : title;
}

/**
 * Aggregates input and output bytes by grouping patterns and sorts by size. Creates structured data for insights table with accurate byte attribution.
 */
export function aggregateAndSortGroups(
  statsSlice: UnifiedStats,
  insights: InsightsConfig,
): { groups: GroupData[]; restGroup: Omit<GroupData, 'icon'> } {
  const groupingRules = insights || [];
  const groupManager = createGroupManager<GroupData>();

  // Initialize groups from rules
  for (const rule of groupingRules) {
    const effectiveTitle = rule.title || DEFAULT_GROUP_NAME;
    groupManager.findOrCreateGroup(effectiveTitle, rule, effectiveTitle);
  }

  const remainingBytesInChunks: Record<string, number> = Object.fromEntries(
    Object.entries(statsSlice).map(([key, { bytes }]) => [key, bytes]),
  );

  // Process input files
  for (const [outputKey, output] of Object.entries(statsSlice)) {
    if (!output.inputs) {
      continue;
    }
    for (const [inputPath, input] of Object.entries(output.inputs)) {
      if (input.bytes === 0) {
        continue;
      }

      const matchingRule = findMatchingRule(inputPath, groupingRules);
      if (matchingRule) {
        const groupKey = generateGroupKey(inputPath, matchingRule);
        const group = groupManager.findOrCreateGroup(
          groupKey,
          matchingRule,
          groupKey,
        );

        group.totalBytes += input.bytes;
        remainingBytesInChunks[outputKey] ??= 0;
        remainingBytesInChunks[outputKey] -= input.bytes;
      }
    }
  }

  // Process output files for remaining bytes
  for (const [outputKey] of Object.entries(statsSlice)) {
    const remainingBytes = remainingBytesInChunks[outputKey];
    if (remainingBytes == null || remainingBytes <= 0) {
      continue;
    }

    const matchingRule = findMatchingRule(outputKey, groupingRules);
    if (matchingRule) {
      const groupKey = generateGroupKey(outputKey, matchingRule);
      const group = groupManager.findOrCreateGroup(
        groupKey,
        matchingRule,
        groupKey,
      );

      group.totalBytes += remainingBytes;
      remainingBytesInChunks[outputKey] = 0;
    }
  }

  const restGroup = {
    totalBytes: Object.values(remainingBytesInChunks).reduce(
      (acc, bytes) => acc + bytes,
      0,
    ),
    title: REST_GROUP_NAME,
  };

  const groups = groupManager.getGroupsWithData();
  groups.sort((a, b) => b.totalBytes - a.totalBytes);

  return { groups, restGroup };
}

/**
 * Converts grouped data into table format with columns and rows. Transforms aggregated insights into displayable table structure.
 */
export function formatGroupsAsTable({
  groups,
  restGroup,
}: {
  groups: GroupData[];
  restGroup: Omit<GroupData, 'icon'>;
}): Table {
  const tableRows: string[][] = [];
  for (const group of groups) {
    const entryPoint = formatEntryPoint(group.title, group.icon);
    const size = formatBytes(group.totalBytes);

    tableRows.push([entryPoint, size]);
  }

  if (restGroup.totalBytes > 0) {
    const entryPoint = formatEntryPoint(restGroup.title);
    const size = formatBytes(restGroup.totalBytes);

    tableRows.push([entryPoint, size]);
  }

  return {
    columns: [
      { key: 'group', label: 'Group', align: 'left' },
      { key: 'size', label: 'Size', align: 'center' },
    ],
    rows: tableRows.map(([group = '', size = '']) => ({
      group,
      size,
    })),
  };
}

/**
 * Creates complete insights table from stats and grouping rules. Combines aggregation and formatting into single operation.
 */
export function createInsightsTable(
  statsSlice: UnifiedStats,
  insights: GroupingRule[],
): Table {
  const { groups, restGroup } = aggregateAndSortGroups(statsSlice, insights);
  return formatGroupsAsTable({ groups, restGroup });
}
