import type { ESLintTarget } from '../config.js';
import { jsonHash } from './hash.js';
import type { RuleData } from './parse.js';
import { detectConfigVersion, selectRulesLoader } from './versions/index.js';

type RulesMap = Record<string, Record<string, RuleData>>;

export async function listRules(targets: ESLintTarget[]): Promise<RuleData[]> {
  const version = await detectConfigVersion();
  const loadRulesMap = selectRulesLoader(version);

  const rulesMap = await targets.reduce(async (acc, target) => {
    const map = await acc;
    const rules = await loadRulesMap(target);
    return rules.reduce(mergeRuleIntoMap, map);
  }, Promise.resolve<RulesMap>({}));

  return Object.values(rulesMap).flatMap<RuleData>(Object.values);
}

function mergeRuleIntoMap(map: RulesMap, rule: RuleData): RulesMap {
  return {
    ...map,
    [rule.id]: {
      ...map[rule.id],
      [jsonHash(rule.options)]: rule,
    },
  };
}

export function expandWildcardRules(
  wildcard: string,
  rules: string[],
): string[] {
  const prefix = wildcard.slice(0, -1);
  return rules.filter(rule => rule.startsWith(prefix));
}
