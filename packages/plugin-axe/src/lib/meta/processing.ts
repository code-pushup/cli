import ansis from 'ansis';
import type { Audit, Group } from '@code-pushup/models';
import {
  expandAuditsForUrls,
  expandGroupsForUrls,
  logger,
  pluralizeToken,
  shouldExpandForUrls,
} from '@code-pushup/utils';
import type { AxePreset } from '../config.js';
import { AXE_PRESET_NAMES } from '../constants.js';
import { formatMetaLog } from './format.js';
import {
  loadAxeRules,
  transformRulesToAudits,
  transformRulesToGroups,
} from './transform.js';

/** Loads and processes Axe rules into audits and groups, expanding for multiple URLs if needed. */
export async function processAuditsAndGroups(
  urls: string[],
  preset: AxePreset,
): Promise<{
  audits: Audit[];
  groups: Group[];
  ruleIds: string[];
}> {
  const rules = await loadAxeRules(preset);
  const ruleIds = rules.map(({ ruleId }) => ruleId);
  const audits = transformRulesToAudits(rules);
  const groups = transformRulesToGroups(rules);

  logger.info(
    formatMetaLog(
      `Loaded ${pluralizeToken('Axe rule', rules.length)} for ${ansis.bold(AXE_PRESET_NAMES[preset])} preset, mapped to audits`,
    ),
  );
  logger.info(
    formatMetaLog(
      `Created ${pluralizeToken('group', groups.length)} from Axe categories`,
    ),
  );

  if (!shouldExpandForUrls(urls.length)) {
    return { audits, groups, ruleIds };
  }

  const expandedAudits = expandAuditsForUrls(audits, urls);
  const expandedGroups = expandGroupsForUrls(groups, urls);
  logger.info(
    formatMetaLog(
      `Expanded audits (${audits.length} → ${expandedAudits.length}) and groups (${groups.length} → ${expandedGroups.length}) for ${pluralizeToken('URL', urls.length)}`,
    ),
  );
  return { audits: expandedAudits, groups: expandedGroups, ruleIds };
}
