import type { Audit } from '@code-pushup/models';
import { ruleIdToSlug } from './hash';
import { RuleData } from './rules';

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
    ...(meta.docs?.url && {
      docsUrl: meta.docs.url,
    }),
  };
}
