import type { Audit, CategoryRef, Group } from '@code-pushup/models';
import type { StyleLintTarget } from './config.js';
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

export async function getGroups({
  stylelintrc,
}: Required<Pick<StyleLintTarget, 'stylelintrc'>>): Promise<Group[]> {
  const audits = await getAudits({ stylelintrc });
  const normalizedConfig = await getNormalizedConfigForFile({ stylelintrc });

  return Object.entries(
    audits.reduce((acc, audit) => {
      const groupSlug =
        getSeverityFromRuleConfig(normalizedConfig.config.rules[audit.slug]) ===
        'error'
          ? 'problem'
          : 'suggestion';
      return {
        ...acc,
        [groupSlug]: [
          ...(acc[groupSlug] ?? []),
          { slug: audit.slug, weight: 1 },
        ],
      };
    }, {}),
  ).map(([groupSlug, refs]) => ({
    slug: groupSlug,
    title: groupSlug,
    refs,
  }));
}

export async function getCategoryRefsFromAudits({
  stylelintrc,
}: Required<Pick<StyleLintTarget, 'stylelintrc'>>): Promise<CategoryRef[]> {
  const audits = await getAudits({ stylelintrc });
  return audits.map(audit => ({
    plugin: 'stylelint',
    weight: 1,
    slug: audit.slug,
    type: 'audit',
  }));
}

export async function getCategoryRefsFromGroups({
  stylelintrc,
}: Required<Pick<StyleLintTarget, 'stylelintrc'>>): Promise<CategoryRef[]> {
  const groups = await getGroups({ stylelintrc });
  return groups.map(({ slug }) => ({
    plugin: 'stylelint',
    weight: 1,
    slug,
    type: 'group',
  }));
}
