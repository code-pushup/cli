import type {
  AuditOutput,
  AuditReport,
  CategoryRef,
  GroupRef,
  PluginScoreTarget,
  Report,
} from '@code-pushup/models';
import { deepClone } from '../transform.js';
import type { ScoredGroup, ScoredReport } from './types.js';

export class GroupRefInvalidError extends Error {
  constructor(auditSlug: string, pluginSlug: string) {
    super(
      `Group has invalid ref - audit with slug ${auditSlug} from plugin ${pluginSlug} not found`,
    );
  }
}

export function scoreReport(report: Report): ScoredReport {
  const allScoredAuditsAndGroups = new Map<string, AuditReport | ScoredGroup>();

  const scoredPlugins = report.plugins.map(plugin => {
    const { groups, ...pluginProps } = plugin;

    plugin.audits.forEach(audit => {
      allScoredAuditsAndGroups.set(`${plugin.slug}-${audit.slug}-audit`, audit);
    });

    function groupScoreFn(ref: GroupRef) {
      const score = allScoredAuditsAndGroups.get(
        `${plugin.slug}-${ref.slug}-audit`,
      )?.score;
      if (score == null) {
        throw new GroupRefInvalidError(ref.slug, plugin.slug);
      }
      return score;
    }

    const scoredGroups =
      groups?.map(group => ({
        ...group,
        score: calculateScore(group.refs, groupScoreFn),
      })) ?? [];

    scoredGroups.forEach(group => {
      allScoredAuditsAndGroups.set(`${plugin.slug}-${group.slug}-group`, group);
    });

    return {
      ...pluginProps,
      ...(scoredGroups.length > 0 && { groups: scoredGroups }),
    };
  });

  function catScoreFn(ref: CategoryRef) {
    const key = `${ref.plugin}-${ref.slug}-${ref.type}`;
    const item = allScoredAuditsAndGroups.get(key);
    if (!item) {
      throw new Error(
        `Category has invalid ref - ${ref.type} with slug ${key} not found in ${ref.plugin} plugin`,
      );
    }
    return item.score;
  }

  const scoredCategories = report.categories?.map(category => ({
    ...category,
    score: calculateScore(category.refs, catScoreFn),
  }));

  return {
    ...deepClone(report),
    plugins: scoredPlugins,
    categories: scoredCategories,
  };
}

export function calculateScore<T extends { weight: number }>(
  refs: T[],
  scoreFn: (ref: T) => number,
): number {
  const validatedRefs = parseScoringParameters(refs, scoreFn);
  const { numerator, denominator } = validatedRefs.reduce(
    (acc, ref) => ({
      numerator: acc.numerator + ref.score * ref.weight,
      denominator: acc.denominator + ref.weight,
    }),
    { numerator: 0, denominator: 0 },
  );

  return numerator / denominator;
}

function parseScoringParameters<T extends { weight: number }>(
  refs: T[],
  scoreFn: (ref: T) => number,
): { weight: number; score: number }[] {
  if (refs.length === 0) {
    throw new Error('Reference array cannot be empty.');
  }

  if (refs.some(ref => ref.weight < 0)) {
    throw new Error('Weight cannot be negative.');
  }

  if (refs.every(ref => ref.weight === 0)) {
    throw new Error('All references cannot have zero weight.');
  }

  const scoredRefs = refs.map(ref => ({
    weight: ref.weight,
    score: scoreFn(ref),
  }));

  if (scoredRefs.some(ref => ref.score < 0 || ref.score > 1)) {
    throw new Error('All scores must be in range 0-1.');
  }

  return scoredRefs;
}

/**
 * Sets audit score to 1 if it meets target.
 * @param audit audit output to evaluate
 * @param scoreTarget threshold for perfect score (0-1)
 * @returns Audit with scoreTarget field
 */
export function scoreAuditWithTarget(
  audit: AuditOutput,
  scoreTarget: number,
): AuditOutput {
  return audit.score >= scoreTarget
    ? { ...audit, score: 1, scoreTarget }
    : { ...audit, scoreTarget };
}

/**
 * Sets audit scores to 1 when targets are met.
 * @param audits audit outputs from plugin execution
 * @param scoreTarget number or { slug: target } mapping
 * @returns Transformed audits with scoreTarget field
 */
export function scoreAuditsWithTarget(
  audits: AuditOutput[],
  scoreTarget: PluginScoreTarget,
): AuditOutput[] {
  if (typeof scoreTarget === 'number') {
    return audits.map(audit => scoreAuditWithTarget(audit, scoreTarget));
  }
  return audits.map(audit => {
    const target = scoreTarget?.[audit.slug];
    return target == null ? audit : scoreAuditWithTarget(audit, target);
  });
}
