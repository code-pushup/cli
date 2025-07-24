import type { Table } from '@code-pushup/models';
import { formatBytes } from '@code-pushup/utils';
import type { GroupingRule } from '../../types.js';
import type { UnifiedStats } from '../../unify/unified-stats.types.js';
import {
  type GroupData,
  createGroupManager,
  findOrCreateGroupFromRule,
  processForTable,
} from './grouping.js';

const DEFAULT_GROUP_NAME = 'Group';
const REST_GROUP_NAME = 'Rest';

// Performance optimizations: Simple pattern cache only
const PATTERN_MATCH_CACHE = new Map<
  string,
  { rule: GroupingRule | null; groupKey: string | null }
>();

export type InsightsTableConfig = GroupingRule[];

/**
 * Simplified aggregation with algorithmic optimizations. Eliminates expensive nested operations and redundant pattern matching.
 */
export function aggregateAndSortGroups(
  statsSlice: UnifiedStats,
  insights: InsightsTableConfig,
): { groups: GroupData[]; restGroup: { title: string; bytes: number } } {
  const groupingRules = insights || [];

  // Early exit optimization
  if (groupingRules.length === 0) {
    const totalBytes = Object.values(statsSlice).reduce(
      (acc, { bytes }) => acc + bytes,
      0,
    );
    return {
      groups: [],
      restGroup: { bytes: totalBytes, title: REST_GROUP_NAME },
    };
  }

  const groupManager = createGroupManager<GroupData>();
  PATTERN_MATCH_CACHE.clear();

  // Pre-create all possible groups to avoid repeated lookups
  const preCreatedGroups = new Map<string, GroupData>();
  for (const rule of groupingRules) {
    const effectiveTitle = rule.title || DEFAULT_GROUP_NAME;
    const group = findOrCreateGroupFromRule(
      groupManager,
      effectiveTitle,
      rule,
      effectiveTitle,
    );
    preCreatedGroups.set(effectiveTitle, group);
  }

  let totalRestBytes = 0;
  const outputEntries = Object.entries(statsSlice);

  // Single-pass processing: collect all inputs first, then process in batch
  const inputsToProcess: Array<{
    inputPath: string;
    inputBytes: number;
    outputKey: string;
  }> = [];

  for (const [outputKey, output] of outputEntries) {
    totalRestBytes += output.bytes;

    if (output.inputs) {
      for (const [inputPath, input] of Object.entries(output.inputs)) {
        if (input.bytes > 0) {
          inputsToProcess.push({
            inputPath,
            inputBytes: input.bytes,
            outputKey,
          });
        }
      }
    }
  }

  // Process all inputs in single optimized loop with early termination
  const outputBytesConsumed = new Map<string, number>();
  const processedInputs = new Set<string>(); // Track inputs that have been fully consumed

  for (const { inputPath, inputBytes, outputKey } of inputsToProcess) {
    // Skip inputs that have already been fully processed by a previous rule
    if (processedInputs.has(inputPath)) {
      continue;
    }

    // Use cached pattern matching
    let matchResult = PATTERN_MATCH_CACHE.get(inputPath);
    if (!matchResult) {
      matchResult = processForTable(inputPath, groupingRules, true);
      PATTERN_MATCH_CACHE.set(inputPath, matchResult);
    }

    const { rule, groupKey } = matchResult;
    if (rule && groupKey) {
      // Use pre-created group or create new
      let group = preCreatedGroups.get(groupKey);
      if (!group) {
        group = findOrCreateGroupFromRule(
          groupManager,
          groupKey,
          rule,
          rule.title || groupKey,
        );
        preCreatedGroups.set(groupKey, group);
      }

      group.bytes += inputBytes;
      group.modules += 1;

      // Track consumed bytes per output
      const consumed = outputBytesConsumed.get(outputKey) || 0;
      outputBytesConsumed.set(outputKey, consumed + inputBytes);
      totalRestBytes -= inputBytes;

      // Mark input as fully processed - no need to check it against other patterns
      processedInputs.add(inputPath);
    }
  }

  // Process remaining output bytes efficiently, skipping outputs with no remaining bytes
  for (const [outputKey, output] of outputEntries) {
    const consumedBytes = outputBytesConsumed.get(outputKey) || 0;
    const remainingBytes = output.bytes - consumedBytes;

    // Skip outputs that have been fully consumed by input processing
    if (remainingBytes <= 0) {
      continue;
    }

    let matchResult = PATTERN_MATCH_CACHE.get(outputKey);
    if (!matchResult) {
      matchResult = processForTable(outputKey, groupingRules, true);
      PATTERN_MATCH_CACHE.set(outputKey, matchResult);
    }

    const { rule, groupKey } = matchResult;
    if (rule && groupKey) {
      let group = preCreatedGroups.get(groupKey);
      if (!group) {
        group = findOrCreateGroupFromRule(
          groupManager,
          groupKey,
          rule,
          rule.title || groupKey,
        );
        preCreatedGroups.set(groupKey, group);
      }
      group.bytes += remainingBytes;
      totalRestBytes -= remainingBytes;
    }
  }

  const restGroup = {
    bytes: Math.max(0, totalRestBytes),
    title: REST_GROUP_NAME,
  };

  const groups = groupManager.getGroupsWithData();

  // Optimized sorting - only sort if we have multiple groups
  if (groups.length > 1) {
    groups.sort((a, b) => b.bytes - a.bytes);
  }

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
        modules: group.modules.toString(),
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
  insights: InsightsTableConfig,
): Table {
  const { groups, restGroup } = aggregateAndSortGroups(statsSlice, insights);
  return createTable(groups, restGroup);
}
