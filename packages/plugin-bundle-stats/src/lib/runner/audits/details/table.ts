import type { Table } from '@code-pushup/models';
import { formatBytes } from '@code-pushup/utils';
import type { GroupingRule } from '../../types.js';
import type { UnifiedStats } from '../../unify/unified-stats.types.js';
import { deriveGroupTitle, matchesAnyPattern } from '../match-pattern.js';

export type InsightsConfig = GroupingRule[];

interface GroupData {
  title: string;
  totalBytes: number;
  icon?: string;
}

export function formatEntryPoint(title: string, icon?: string): string {
  return icon ? `${icon} ${title}` : title;
}

export function aggregateAndSortGroups(
  statsSlice: UnifiedStats,
  insights: InsightsConfig,
): { groups: GroupData[]; restGroup: Omit<GroupData, 'icon'> } {
  const groupingRules = insights || [];
  const groupedData = new Map<
    string,
    {
      totalBytes: number;
      icon?: string;
      title: string;
    }
  >();

  for (const rule of groupingRules) {
    const effectiveTitle = rule.title || 'Group';
    groupedData.set(effectiveTitle, {
      totalBytes: 0,
      icon: rule.icon,
      title: effectiveTitle,
    });
  }

  const remainingBytesInChunks: Record<string, number> = Object.fromEntries(
    Object.entries(statsSlice).map(([key, { bytes }]) => [key, bytes]),
  );

  for (const [outputKey, output] of Object.entries(statsSlice)) {
    if (!output.inputs) {
      continue;
    }
    for (const [inputPath, input] of Object.entries(output.inputs)) {
      if (input.bytes === 0) {
        continue;
      }
      for (const rule of groupingRules) {
        if (
          matchesAnyPattern(inputPath, rule.patterns, {
            matchBase: true,
            normalizeRelativePaths: true,
          })
        ) {
          const groupKey = deriveGroupTitle(
            inputPath,
            rule.patterns,
            rule.title || 'Group',
          );
          const group =
            groupedData.get(groupKey) ??
            groupedData
              .set(groupKey, {
                totalBytes: 0,
                icon: rule.icon,
                title: groupKey,
              })
              .get(groupKey)!;
          group.totalBytes += input.bytes;
          remainingBytesInChunks[outputKey] ??= 0;
          remainingBytesInChunks[outputKey] -= input.bytes;
          break;
        }
      }
    }
  }

  for (const [outputKey] of Object.entries(statsSlice)) {
    const remainingBytes = remainingBytesInChunks[outputKey];
    if (remainingBytes == null || remainingBytes <= 0) {
      continue;
    }
    for (const rule of groupingRules) {
      if (
        matchesAnyPattern(outputKey, rule.patterns, {
          matchBase: true,
          normalizeRelativePaths: true,
        })
      ) {
        const groupKey = deriveGroupTitle(
          outputKey,
          rule.patterns,
          rule.title || 'Group',
        );
        const group =
          groupedData.get(groupKey) ??
          groupedData
            .set(groupKey, {
              totalBytes: 0,
              icon: rule.icon,
              title: groupKey,
            })
            .get(groupKey)!;
        group.totalBytes += remainingBytes;
        remainingBytesInChunks[outputKey] = 0;
        break;
      }
    }
  }

  const restGroup = {
    totalBytes: Object.values(remainingBytesInChunks).reduce(
      (acc, bytes) => acc + bytes,
      0,
    ),
    title: 'Rest',
  };

  const groups = [...groupedData.values()].filter(g => g.totalBytes > 0);
  groups.sort((a, b) => b.totalBytes - a.totalBytes);

  return { groups, restGroup };
}

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

export function createInsightsTable(
  statsSlice: UnifiedStats,
  insights: GroupingRule[],
): Table {
  const { groups, restGroup } = aggregateAndSortGroups(statsSlice, insights);
  return formatGroupsAsTable({ groups, restGroup });
}
