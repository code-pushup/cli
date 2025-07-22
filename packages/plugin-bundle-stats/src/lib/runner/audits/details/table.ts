import type { Table } from '@code-pushup/models';
import { formatBytes } from '@code-pushup/utils';
import type { GroupingRule } from '../../types.js';
import type { UnifiedStats } from '../../unify/unified-stats.types.js';
import {
  type GroupData,
  createGroupManager,
  findOrCreateGroupFromRule,
  processForTable,
} from './utils/grouping-engine.js';

const DEFAULT_GROUP_NAME = 'Group';
const REST_GROUP_NAME = 'Rest';

export type InsightsConfig = GroupingRule[];

/**
 * Simplified aggregation using direct functions. Simple table grouping without engine complexity.
 */
export function aggregateAndSortGroups(
  statsSlice: UnifiedStats,
  insights: InsightsConfig,
): { groups: GroupData[]; restGroup: { title: string; bytes: number } } {
  const groupingRules = insights || [];
  const groupManager = createGroupManager<GroupData>();

  // Pre-create groups
  for (const rule of groupingRules) {
    const effectiveTitle = rule.title || DEFAULT_GROUP_NAME;
    findOrCreateGroupFromRule(
      groupManager,
      effectiveTitle,
      rule,
      effectiveTitle,
    );
  }

  const remainingBytesInChunks: Record<string, number> = {};
  const outputEntries = Object.entries(statsSlice);

  for (const [key, { bytes }] of outputEntries) {
    remainingBytesInChunks[key] = bytes;
  }

  // Process inputs with simple functions
  for (const [outputKey, output] of outputEntries) {
    if (!output.inputs) {
      continue;
    }

    const inputEntries = Object.entries(output.inputs);
    for (const [inputPath, input] of inputEntries) {
      if (input.bytes === 0) {
        continue;
      }

      // Use simple function for rule matching and key generation
      const { rule, groupKey } = processForTable(
        inputPath,
        groupingRules,
        true,
      );
      if (rule && groupKey) {
        const group = findOrCreateGroupFromRule(
          groupManager,
          groupKey,
          rule,
          rule.title || groupKey,
        );

        group.bytes += input.bytes;
        remainingBytesInChunks[outputKey] =
          (remainingBytesInChunks[outputKey] || 0) - input.bytes;
      }
    }
  }

  // Process outputs with simple functions
  for (const [outputKey] of outputEntries) {
    const remainingBytes = remainingBytesInChunks[outputKey];
    if (remainingBytes == null || remainingBytes <= 0) {
      continue;
    }

    const { rule, groupKey } = processForTable(outputKey, groupingRules, true);
    if (rule && groupKey) {
      const group = findOrCreateGroupFromRule(
        groupManager,
        groupKey,
        rule,
        rule.title || groupKey,
      );

      group.bytes += remainingBytes;
      remainingBytesInChunks[outputKey] = 0;
    }
  }

  const restGroup = {
    bytes: Object.values(remainingBytesInChunks).reduce(
      (acc, bytes) => acc + bytes,
      0,
    ),
    title: REST_GROUP_NAME,
  };

  const groups = groupManager.getGroupsWithData();
  groups.sort((a, b) => b.bytes - a.bytes);

  return { groups, restGroup };
}

/**
 * Transforms aggregated group data into table format. Creates table rows from group statistics.
 */
export function createTable(
  groups: GroupData[],
  restGroup: { title: string; bytes: number },
): Table {
  const rows: { group: string; modules: string; size: string }[] = [];

  for (const group of groups) {
    if (group.bytes > 0) {
      rows.push({
        group: `${group.icon || '📁'} ${group.title}`,
        modules: group.sources.toString(),
        size: formatBytes(group.bytes),
      });
    }
  }

  if (restGroup.bytes > 0) {
    rows.push({
      group: '📄 Rest',
      modules: '-',
      size: formatBytes(restGroup.bytes),
    });
  }

  return {
    columns: [
      { key: 'group', label: 'Group', align: 'left' },
      { key: 'modules', label: 'Modules', align: 'right' },
      { key: 'size', label: 'Size', align: 'right' },
    ],
    rows,
  };
}

/**
 * Creates insights table from stats and grouping rules. Combines aggregation and table formatting.
 */
export function createInsightsTable(
  statsSlice: UnifiedStats,
  insights: InsightsConfig,
): Table {
  const { groups, restGroup } = aggregateAndSortGroups(statsSlice, insights);
  return createTable(groups, restGroup);
}
