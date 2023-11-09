import type { ESLint } from 'eslint';
import type { Audit, AuditGroup } from '@code-pushup/models';
import { groupsFromRuleCategories, groupsFromRuleTypes } from './groups';
import { listRules } from './rules';
import { ruleToAudit } from './transform';

export async function listAuditsAndGroups(
  eslint: ESLint,
  patterns: string | string[],
): Promise<{ audits: Audit[]; groups: AuditGroup[] }> {
  const rules = await listRules(eslint, patterns);

  const audits = rules.map(ruleToAudit);

  const groups = [
    ...groupsFromRuleTypes(rules),
    ...groupsFromRuleCategories(rules),
  ];

  return { audits, groups };
}
