import type { Audit } from '@code-pushup/models';
import type { ESLint } from 'eslint';
import { ruleIdToSlug } from './hash';
import { RuleData, listRules } from './rules';

export async function listAudits(
  eslint: ESLint,
  patterns: string | string[],
): Promise<Audit[]> {
  const rules = await listRules(eslint, patterns);
  return rules.map(ruleToAudit);
}

export function ruleToAudit({ ruleId, meta, options }: RuleData): Audit {
  const name = ruleId.split('/').at(-1) ?? ruleId;
  const plugin =
    name === ruleId ? null : ruleId.slice(0, ruleId.lastIndexOf('/'));

  const lines: string[] = [
    `ESLint rule **${name}**${plugin ? `, from _${plugin}_ plugin` : ''}.`,
    ...(options?.length ? ['Custom options:'] : []),
    ...(options?.map(option =>
      ['```json', JSON.stringify(option, null, 2), '```'].join('\n'),
    ) ?? []),
  ];

  return {
    slug: ruleIdToSlug(ruleId, options),
    title: meta.docs?.description ?? name,
    description: lines.join('\n\n'),
    docsUrl: meta.docs?.url,
  };
}
