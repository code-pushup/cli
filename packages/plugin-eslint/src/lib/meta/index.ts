import type { Audit, Group } from '@code-pushup/models';
import type { CustomGroup, ESLintTarget } from '../config.js';
import {
  groupsFromCustomConfig,
  groupsFromRuleCategories,
  groupsFromRuleTypes,
} from './groups.js';
import { listRules } from './rules.js';
import { ruleToAudit } from './transform.js';

export { ruleIdToSlug } from './hash.js';
export { detectConfigVersion, type ConfigFormat } from './versions/index.js';

export async function listAuditsAndGroups(
  targets: ESLintTarget[],
  customGroups: CustomGroup[] | undefined,
): Promise<{ audits: Audit[]; groups: Group[] }> {
  const rules = await listRules(targets);

  const resolvedCustomGroups = customGroups
    ? groupsFromCustomConfig(rules, customGroups)
    : [];

  const audits = rules.map(ruleToAudit);

  const groups = [
    ...groupsFromRuleTypes(rules),
    ...groupsFromRuleCategories(rules),
    ...resolvedCustomGroups,
  ];

  return { audits, groups };
}
