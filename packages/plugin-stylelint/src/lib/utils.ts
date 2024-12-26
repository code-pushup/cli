import type { Config, ConfigRuleSettings } from 'stylelint';
import type { Audit, Group } from '@code-pushup/models';
import { truncateDescription, truncateTitle } from '@code-pushup/utils';

export async function listAuditsAndGroups(
  rules: Config['rules'] = [],
): Promise<{ audits: Audit[]; groups: Group[] }> {
  const audits = rules.map(ruleToAudit);

  const groups = [];

  return { audits, groups };
}

export function ruleToAudit(rule: ConfigRuleSettings<any, Object>): Audit {
  const name = rule.id.split('/').at(-1) ?? rule.id;
  const plugin =
    name === rule.id ? null : rule.id.slice(0, rule.id.lastIndexOf('/'));
  const pluginContext = plugin ? `, from _${plugin}_ plugin` : '';

  const lines: string[] = [
    `ESLint rule **${name}**${pluginContext}.`,
    ...(rule.options?.length ? ['Custom options:'] : []),
    ...(rule.options?.map(option =>
      ['```json', JSON.stringify(option, null, 2), '```'].join('\n'),
    ) ?? []),
  ];

  return {
    slug: rule,
    title: truncateTitle(rule.meta.docs?.description ?? name),
    description: truncateDescription(lines.join('\n\n')),
    ...(rule.meta.docs?.url && {
      docsUrl: rule.meta.docs.url,
    }),
  };
}
