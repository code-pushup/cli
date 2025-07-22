import type { Table } from '@code-pushup/models';
import { formatBytes } from '@code-pushup/utils';
import type { GroupingRule } from '../../types.js';
import type { UnifiedStats } from '../../unify/unified-stats.types.js';
import {
  findMatchingRule,
  generateGroupKey,
  matchesAnyPattern,
} from './utils/match-pattern.js';
import { type GroupData, createGroupManager } from './utils/table-utils.js';

const DEFAULT_GROUP_NAME = 'Group';
const REST_GROUP_NAME = 'Rest';

export type InsightsConfig = GroupingRule[];

const globalRuleMatchCache = new Map<
  string,
  { ruleIndex: number; groupKey: string } | null
>();

interface CompiledRule {
  rule: GroupingRule;
  matcher: (path: string) => boolean;
  groupKeyCache: Map<string, string>;
  ruleIndex: number;
}

export function clearRuleMatchCache(): void {
  globalRuleMatchCache.clear();
}

function compileGroupingRules(rules: GroupingRule[]): CompiledRule[] {
  return rules.map((rule, ruleIndex) => {
    const { patterns } = rule;

    const matcher = (filePath: string): boolean => {
      return matchesAnyPattern(filePath, patterns, {
        matchBase: true,
        normalizeRelativePaths: true,
      });
    };

    return {
      rule,
      matcher,
      groupKeyCache: new Map<string, string>(),
      ruleIndex,
    };
  });
}

function findMatchingCompiledRule(
  filePath: string,
  compiledRules: CompiledRule[],
): CompiledRule | null {
  const cached = globalRuleMatchCache.get(filePath);
  if (cached !== undefined) {
    return cached ? compiledRules[cached.ruleIndex] || null : null;
  }

  // Process rules in reverse order to match tree logic precedence
  // More specific rules (later in array) take precedence over general ones
  for (let i = compiledRules.length - 1; i >= 0; i--) {
    const compiledRule = compiledRules[i];
    if (compiledRule && compiledRule.matcher(filePath)) {
      globalRuleMatchCache.set(filePath, {
        ruleIndex: compiledRule.ruleIndex,
        groupKey: '',
      });
      return compiledRule;
    }
  }

  globalRuleMatchCache.set(filePath, null);
  return null;
}

function getCachedGroupKey(
  filePath: string,
  compiledRule: CompiledRule,
  preferRuleTitle: boolean = false,
): string {
  const globalCached = globalRuleMatchCache.get(filePath);
  if (globalCached && globalCached.groupKey) {
    return globalCached.groupKey;
  }

  let groupKey = compiledRule.groupKeyCache.get(filePath);
  if (!groupKey) {
    groupKey = generateGroupKey(filePath, compiledRule.rule, preferRuleTitle);
    compiledRule.groupKeyCache.set(filePath, groupKey);

    if (globalCached) {
      globalCached.groupKey = groupKey;
    }
  }
  return groupKey;
}

export function formatEntryPoint(title: string, icon?: string): string {
  return icon ? `${icon} ${title}` : title;
}

export function aggregateAndSortGroups(
  statsSlice: UnifiedStats,
  insights: InsightsConfig,
): { groups: GroupData[]; restGroup: Omit<GroupData, 'icon'> } {
  const groupingRules = insights || [];

  const compiledRules = compileGroupingRules(groupingRules);
  const groupManager = createGroupManager<GroupData>();

  for (const rule of groupingRules) {
    const effectiveTitle = rule.title || DEFAULT_GROUP_NAME;
    groupManager.findOrCreateGroup(effectiveTitle, rule, effectiveTitle);
  }

  const remainingBytesInChunks: Record<string, number> = {};
  const outputEntries = Object.entries(statsSlice);

  for (const [key, { bytes }] of outputEntries) {
    remainingBytesInChunks[key] = bytes;
  }

  for (const [outputKey, output] of outputEntries) {
    if (!output.inputs) {
      continue;
    }

    const inputEntries = Object.entries(output.inputs);
    for (const [inputPath, input] of inputEntries) {
      if (input.bytes === 0) {
        continue;
      }

      const matchingCompiledRule = findMatchingCompiledRule(
        inputPath,
        compiledRules,
      );
      if (matchingCompiledRule) {
        // For input files, prefer rule title to support explicit titles like "Theme Park Package"
        const groupKey = getCachedGroupKey(
          inputPath,
          matchingCompiledRule,
          true,
        );
        const group = groupManager.findOrCreateGroup(
          groupKey,
          matchingCompiledRule.rule,
          matchingCompiledRule.rule.title || groupKey,
        );

        group.totalBytes += input.bytes;
        remainingBytesInChunks[outputKey] =
          (remainingBytesInChunks[outputKey] || 0) - input.bytes;
      }
    }
  }

  for (const [outputKey] of outputEntries) {
    const remainingBytes = remainingBytesInChunks[outputKey];
    if (remainingBytes == null || remainingBytes <= 0) {
      continue;
    }

    const matchingCompiledRule = findMatchingCompiledRule(
      outputKey,
      compiledRules,
    );
    if (matchingCompiledRule) {
      const groupKey = getCachedGroupKey(
        outputKey,
        matchingCompiledRule,
        false,
      );
      const group = groupManager.findOrCreateGroup(
        groupKey,
        matchingCompiledRule.rule,
        matchingCompiledRule.rule.title || groupKey,
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
