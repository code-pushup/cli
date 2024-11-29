import type { Audit, Group } from '@code-pushup/models';
import type { ESLintTarget } from '../config.js';
import { groupsFromRuleCategories, groupsFromRuleTypes } from './groups.js';
import { listRules } from './rules.js';
import { ruleToAudit } from './transform.js';

export { detectConfigVersion, type ConfigFormat } from './versions';

export async function listAuditsAndGroups(
  targets: ESLintTarget[],
): Promise<{ audits: Audit[]; groups: Group[] }> {
  const rules = await listRules(targets);

  const audits = rules.map(ruleToAudit);

  const groups = [
    ...groupsFromRuleTypes(rules),
    ...groupsFromRuleCategories(rules),
  ];

  return { audits, groups };
}
