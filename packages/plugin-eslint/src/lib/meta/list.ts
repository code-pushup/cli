import type { Audit, Group } from '@code-pushup/models';
import {
  formatAsciiTable,
  logger,
  pluralizeToken,
  profiler,
} from '@code-pushup/utils';
import type { CustomGroup, ESLintTarget } from '../config.js';
import { formatMetaLog } from './format.js';
import {
  groupsFromCustomConfig,
  groupsFromRuleCategories,
  groupsFromRuleTypes,
} from './groups.js';
import { listRules } from './rules.js';
import { ruleToAudit } from './transform.js';

export { ruleIdToSlug } from './hash.js';
export { detectConfigVersion, type ConfigFormat } from './versions/index.js';
export { formatMetaLog };

export async function listAuditsAndGroups(
  targets: ESLintTarget[],
  customGroups?: CustomGroup[] | undefined,
): Promise<{ audits: Audit[]; groups: Group[] }> {
  const rules = await profiler.measureAsync(
    'plugin-eslint:eslint-rules-gathering',
    () => listRules(targets),
    {
      ...profiler.measureConfig.tracks.pluginEslint,
      color: 'tertiary-dark',
      success: (rules: Awaited<ReturnType<typeof listRules>>) => ({
        properties: [
          ['Targets', String(targets.length)],
          ['Rules', String(rules.length)],
        ],
        tooltipText: `Gathered ${rules.length} ESLint rules from ${targets.length} targets using ESLint native APIs`,
      }),
    },
  );
  const audits = rules.map(ruleToAudit);

  logger.info(
    formatMetaLog(
      `Found ${pluralizeToken('rule', rules.length)} in total for ${pluralizeToken('target', targets.length)}, mapped to audits`,
    ),
  );

  const resolvedTypeGroups = groupsFromRuleTypes(rules);
  const resolvedCategoryGroups = groupsFromRuleCategories(rules);
  const resolvedCustomGroups = customGroups
    ? groupsFromCustomConfig(rules, customGroups)
    : [];
  const groups = [
    ...resolvedTypeGroups,
    ...resolvedCategoryGroups,
    ...resolvedCustomGroups,
  ];

  logger.info(
    formatMetaLog(
      `Created ${pluralizeToken('group', groups.length)} (${resolvedTypeGroups.length} from meta.type, ${resolvedCategoryGroups.length} from meta.docs.category, ${resolvedCustomGroups.length} from custom groups)`,
    ),
  );
  logger.debug(
    formatMetaLog(
      formatAsciiTable(
        {
          rows: groups.map(group => [
            `• ${group.title}`,
            pluralizeToken('audit', group.refs.length),
          ]),
        },
        { borderless: true },
      ),
    ),
  );

  return { audits, groups };
}
