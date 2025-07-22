import type { GroupingRule } from '../../../types';
import { findMatchingRule, generateGroupKey } from './match-pattern';

export interface GroupData {
  title: string;
  totalBytes: number;
  icon?: string;
}

export interface GroupManager<T extends GroupData = GroupData> {
  groups: Map<string, T>;
  findOrCreateGroup(key: string, rule: GroupingRule, defaultTitle?: string): T;
  getAllGroups(): T[];
  getGroupsWithData(): T[];
}

export function createGroupManager<T extends GroupData>(): GroupManager<T> {
  const groups = new Map<string, T>();

  return {
    groups,
    findOrCreateGroup(
      key: string,
      rule: GroupingRule,
      defaultTitle?: string,
    ): T {
      let group = groups.get(key);
      if (!group) {
        const title = rule.title || defaultTitle || key;
        group = {
          title,
          totalBytes: 0,
          icon: rule.icon,
        } as T;
        groups.set(key, group);
      }
      return group;
    },
    getAllGroups(): T[] {
      return [...groups.values()];
    },
    getGroupsWithData(): T[] {
      return [...groups.values()].filter(g => g.totalBytes > 0);
    },
  };
}
