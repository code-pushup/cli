import {
  AuditGroup,
  AuditGroupRef,
  AuditReport,
  CategoryConfig,
  CategoryRef,
  PluginReport,
  Report,
} from '@code-pushup/models';

type EnrichedAuditReport = AuditReport & { plugin: string };
type ScoredCategoryConfig = CategoryConfig & { score: number };

export type EnrichedScoredAuditGroup = AuditGroup & {
  plugin: string;
  score: number;
};

export type ScoredReport = Omit<Report, 'plugins' | 'categories'> & {
  plugins: (Omit<PluginReport, 'audits' | 'groups'> & {
    audits: EnrichedAuditReport[];
    groups: EnrichedScoredAuditGroup[];
  })[];
  categories: ScoredCategoryConfig[];
};

function groupRefToScore(
  audits: AuditReport[],
): (ref: AuditGroupRef) => number {
  return ref => {
    const score = audits.find(audit => audit.slug === ref.slug)?.score;
    if (score == null) {
      throw new Error(
        `Group has invalid ref - audit with slug ${ref.slug} not found`,
      );
    }
    return score;
  };
}

function categoryRefToScore(
  audits: EnrichedAuditReport[],
  groups: EnrichedScoredAuditGroup[],
): (ref: CategoryRef) => number {
  // Create lookup objects
  const auditLookup = audits.reduce<Record<string, EnrichedAuditReport>>(
    (lookup, audit) => {
      lookup[`${audit.plugin}-${audit.slug}`] = audit;
      return lookup;
    },
    {},
  );

  const groupLookup = groups.reduce<Record<string, EnrichedScoredAuditGroup>>(
    (lookup, group) => {
      lookup[`${group.plugin}-${group.slug}`] = group;
      return lookup;
    },
    {},
  );

  return (ref: CategoryRef): number => {
    switch (ref.type) {
      case 'audit': {
        const audit = auditLookup[`${ref.plugin}-${ref.slug}`];
        if (!audit) {
          throw new Error(
            `Category has invalid ref - audit with slug ${ref.slug} not found in ${ref.plugin} plugin`,
          );
        }
        return audit.score;
      }

      case 'group': {
        const group = groupLookup[`${ref.plugin}-${ref.slug}`];
        if (!group) {
          throw new Error(
            `Category has invalid ref - group with slug ${ref.slug} not found in ${ref.plugin} plugin`,
          );
        }
        return group.score;
      }

      default:
        throw new Error(`Type ${ref.type} is unknown`);
    }
  };
}

export function calculateScore<T extends { weight: number }>(
  refs: T[],
  scoreFn: (ref: T) => number,
): number {
  const { numerator, denominator } = refs.reduce(
    (acc, ref) => {
      acc.numerator += scoreFn(ref) * ref.weight;
      acc.denominator += ref.weight;
      return acc;
    },
    { numerator: 0, denominator: 0 },
  );
  return numerator / denominator;
}

export function scoreReport(report: Report): ScoredReport {
  const allScoredAudits: EnrichedAuditReport[] = [];
  const allScoredGroups: EnrichedScoredAuditGroup[] = [];

  const scoredPlugins = report.plugins.map(plugin => {
    const { groups, audits } = plugin;
    const preparedAudits = audits.map(audit => ({
      ...audit,
      plugin: plugin.slug,
    }));
    allScoredAudits.push(...preparedAudits);

    const preparedGroups =
      groups?.map(group => {
        const scoredGroup = {
          ...group,
          score: calculateScore(group.refs, groupRefToScore(preparedAudits)),
          plugin: plugin.slug,
        };
        allScoredGroups.push(scoredGroup);
        return scoredGroup;
      }) || [];

    return {
      ...plugin,
      audits: preparedAudits,
      groups: preparedGroups,
    };
  });

  const scoredCategories = report.categories.map(category => ({
    ...category,
    score: calculateScore(
      category.refs,
      categoryRefToScore(allScoredAudits, allScoredGroups),
    ),
  }));

  return {
    ...report,
    categories: scoredCategories,
    plugins: scoredPlugins,
  };
}
