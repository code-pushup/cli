import type { ConfigRuleSettings } from 'stylelint';
import type { Audit, CategoryRef } from '@code-pushup/models';
import {
  type StyleLintPluginConfig,
  type StyleLintTarget,
  stylelintPluginConfigSchema,
} from './config.js';
import {
  DEFAULT_STYLELINTRC,
  GROUPS,
  STYLELINT_PLUGIN_SLUG,
} from './constants.js';
import type { ActiveConfigRuleSetting } from './runner/model.js';
import { getNormalizedConfigForFile } from './runner/normalize-config.js';
import { getSeverityFromRuleConfig } from './runner/utils.js';

export function auditSlugToFullAudit(slug: string): Audit {
  return {
    slug,
    title: slug,
    docsUrl: `https://stylelint.io/user-guide/rules/${slug}`,
  };
}

export async function getAudits(
  options: Required<Pick<StyleLintTarget, 'stylelintrc'>>,
): Promise<Audit[]> {
  const normalizedConfig = await getNormalizedConfigForFile(options);
  return Object.keys(normalizedConfig.config.rules).map(auditSlugToFullAudit);
}

export async function getGroups(
  options: Required<Pick<StyleLintTarget, 'stylelintrc'>>,
) {
  const { config } = await getNormalizedConfigForFile(options);
  const { rules, defaultSeverity } = config;
  return GROUPS.map(group => ({
    ...group,
    refs: Object.entries(rules)
      .filter(filterNonNull) // TODO Type Narrowing is not fully working for the nulls / undefineds
      .filter(([_, ruleConfig]) => {
        const severity = getSeverityFromRuleConfig(
          ruleConfig as ActiveConfigRuleSetting,
          defaultSeverity,
        );
        if (severity === 'error' && group.slug === 'problems') {
          return true;
        } else if (severity === 'warning' && group.slug === 'suggestions') {
          return true;
        }
        return false;
      })
      .map(([rule]) => ({ slug: rule, weight: 1 })),
  })).filter(group => group.refs.length > 0);
}

export async function getCategoryRefsFromGroups(
  opt?: StyleLintPluginConfig,
): Promise<CategoryRef[]> {
  const { stylelintrc = DEFAULT_STYLELINTRC } =
    stylelintPluginConfigSchema.parse(opt)[0] as StyleLintTarget;
  const groups = await getGroups({ stylelintrc });
  return groups.map(({ slug }) => ({
    plugin: STYLELINT_PLUGIN_SLUG,
    slug,
    weight: 1,
    type: 'group',
  }));
}

export async function getCategoryRefsFromAudits(
  opt?: StyleLintPluginConfig,
): Promise<CategoryRef[]> {
  const { stylelintrc = DEFAULT_STYLELINTRC } =
    stylelintPluginConfigSchema.parse(opt)[0] as StyleLintTarget;
  const audits = await getAudits({ stylelintrc });
  return audits.map(({ slug }) => ({
    plugin: STYLELINT_PLUGIN_SLUG,
    slug,
    weight: 1,
    type: 'audit',
  }));
}

function filterNonNull<T, O extends object = object>(
  settings: Array<ConfigRuleSettings<T, O>>,
): Exclude<ConfigRuleSettings<T, O>, null | undefined>[] {
  return settings.filter(
    (setting): setting is Exclude<ConfigRuleSettings<T, O>, null | undefined> =>
      setting !== null && setting !== undefined,
  );
}
