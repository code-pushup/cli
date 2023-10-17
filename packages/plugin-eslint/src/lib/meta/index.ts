import type { ESLint } from 'eslint';
import type { Audit } from '@code-pushup/models';
import { listRules } from './rules';
import { ruleToAudit } from './transform';

export async function listAudits(
  eslint: ESLint,
  patterns: string | string[],
): Promise<Audit[]> {
  const rules = await listRules(eslint, patterns);
  return rules.map(ruleToAudit);
}
