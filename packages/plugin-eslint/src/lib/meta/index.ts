import type { Audit, Group } from '@code-pushup/models';
import type { ESLintTarget } from '../config';
import { groupsFromRuleCategories, groupsFromRuleTypes } from './groups';
import { listRules } from './rules';
import { ruleToAudit } from './transform';

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
