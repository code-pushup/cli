import type {Audit, CategoryRef, Group} from '@code-pushup/models';
import type {StyleLintTarget} from './config.js';
import {getNormalizedConfigForFile} from './runner/normalize-config.js';

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
  {stylelintrc}: Required<Pick<StyleLintTarget, 'stylelintrc'>>,
): Promise<Group[]> {
  const audits = await getAudits({stylelintrc});
  const normalizedConfig = await getNormalizedConfigForFile({stylelintrc});

  return Object.entries(audits.reduce((acc, audit) => {
    const groupSlug = getRuleSeverity(audit.slug, normalizedConfig.config);
    return {
      ...acc,
      [groupSlug]: [...acc[groupSlug] ?? [], {slug: audit.slug, weight: 1}],
    };
  }, {
  //  warning: [],
//    error: [],
  })).map(([groupSlug, refs]) => ({
    slug: groupSlug,
    title: groupSlug,
    refs,
  }));
}

function getRuleSeverity(rule, config) {
  const ruleConfig = config.rules[rule];

  if (!ruleConfig) {
    return "Rule not found in configuration.";
  }

  // Handle array-based configurations
  if (Array.isArray(ruleConfig)) {
    const firstElement = ruleConfig[0];

    // Explicit severity defined
    if (firstElement === "warning" || firstElement === "error") {
      return firstElement; // Either "warning" or "error"
    }
    // Default severity for enabled rules
    if (firstElement === true) {
      return "error"; // Default to "error"
    }
    // Disabled rules
    if (firstElement === false) {
      return "disabled"; // No severity for disabled rules
    }

    // special
    if (typeof firstElement === 'string' || typeof firstElement === 'number') {
      return 'error'; // No severity for disabled rules
    }

    // Fallback for unrecognized formats
    return "unknown";
  }

  // Default severity for enabled rules
  if (ruleConfig === true) {
    return "error"; // Default to "error"
  }

  // Disabled rules
  if (ruleConfig === false) {
    return "disabled"; // No severity for disabled rules
  }

  // Fallback for unrecognized formats
  return "unknown";
}

export async function getCategoryRefsFromAudits({stylelintrc}: Required<Pick<StyleLintTarget, 'stylelintrc'>>): Promise<CategoryRef[]> {
  const audits = await getAudits({stylelintrc});
  return audits.map((audit) => ({
    plugin: 'stylelint',
    weight: 1,
    slug: audit.slug,
    type: 'audit',
  }));
}

export async function getCategoryRefsFromGroups({stylelintrc}: Required<Pick<StyleLintTarget, 'stylelintrc'>>): Promise<CategoryRef[]> {
  const groups = await getGroups({stylelintrc});
  return groups.map(({slug}) => ({
    plugin: 'stylelint',
    weight: 1,
    slug,
    type: 'group',
  }));
}
