import type { Linter, Rule } from 'eslint';
import { toArray } from '@code-pushup/utils';

export type RuleData = {
  ruleId: string;
  meta: Rule.RuleMetaData;
  options: unknown[] | undefined;
};

export function parseRuleId(ruleId: string): { plugin?: string; name: string } {
  const i = ruleId.lastIndexOf('/');
  if (i < 0) {
    return { name: ruleId };
  }
  return {
    plugin: ruleId.slice(0, i),
    name: ruleId.slice(i + 1),
  };
}

export function isRuleOff(entry: Linter.RuleEntry<unknown[]>): boolean {
  const level: Linter.RuleLevel = Array.isArray(entry) ? entry[0] : entry;

  switch (level) {
    case 0:
    case 'off':
      return true;
    case 1:
    case 2:
    case 'warn':
    case 'error':
      return false;
  }
}

export function optionsFromRuleEntry(
  entry: Linter.RuleEntry<unknown[]>,
): unknown[] {
  return toArray(entry).slice(1);
}
