import type { Audit, Group } from '@code-pushup/models';
import {
  expandAuditsForUrls,
  expandGroupsForUrls,
  shouldExpandForUrls,
} from '@code-pushup/utils';
import type { AxePreset } from './constants.js';
import {
  loadAxeRules,
  transformRulesToAudits,
  transformRulesToGroups,
} from './meta/transform.js';

export function processAuditsAndGroups(
  urls: string[],
  preset: AxePreset,
): {
  audits: Audit[];
  groups: Group[];
  ruleIds: string[];
} {
  const rules = loadAxeRules(preset);
  const ruleIds = rules.map(({ ruleId }) => ruleId);
  const audits = transformRulesToAudits(rules);
  const groups = transformRulesToGroups(rules, preset);

  if (!shouldExpandForUrls(urls.length)) {
    return { audits, groups, ruleIds };
  }

  return {
    audits: expandAuditsForUrls(audits, urls),
    groups: expandGroupsForUrls(groups, urls),
    ruleIds,
  };
}
