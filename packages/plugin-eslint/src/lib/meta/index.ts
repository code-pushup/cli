import type { ESLint } from 'eslint';
import type { Audit, Group } from '@code-pushup/models';
import { groupsFromRuleCategories, groupsFromRuleTypes } from './groups';
import { listRules } from './rules';
import { ruleToAudit } from './transform';

export async function listAuditsAndGroups(
  eslint: ESLint,
  patterns: string | string[],
): Promise<{ audits: Audit[]; groups: Group[] }> {
  const rules = await listRules(eslint, patterns);

  const audits = rules.map(ruleToAudit);

  const groups = [
    ...groupsFromRuleTypes(rules),
    ...groupsFromRuleCategories(rules),
  ];

  return { audits, groups };
}
