import type { Audit } from '@code-pushup/models';
import { truncateDescription, truncateTitle } from '@code-pushup/utils';
import { ruleIdToSlug } from './hash.js';
import type { RuleData } from './parse.js';

export function ruleToAudit({ ruleId, meta, options }: RuleData): Audit {
  const name = ruleId.split('/').at(-1) ?? ruleId;
  const plugin =
    name === ruleId ? null : ruleId.slice(0, ruleId.lastIndexOf('/'));
  const pluginContext = plugin ? `, from _${plugin}_ plugin` : '';

  const lines: string[] = [
    `ESLint rule **${name}**${pluginContext}.`,
    ...(options?.length ? ['Custom options:'] : []),
    ...(options?.map(option =>
      ['```json', JSON.stringify(option, null, 2), '```'].join('\n'),
    ) ?? []),
  ];

  return {
    slug: ruleIdToSlug(ruleId, options),
    title: truncateTitle(meta.docs?.description ?? name),
    description: truncateDescription(lines.join('\n\n')),
    ...(meta.docs?.url && {
      docsUrl: meta.docs.url,
    }),
  };
}
