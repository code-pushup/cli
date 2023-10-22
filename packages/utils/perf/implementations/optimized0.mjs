function groupRefToScore(audits) {
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

function categoryRefToScore(audits, groups) {
  return ref => {
    let audit;
    let group;

    switch (ref.type) {
      case 'audit':
        audit = audits.find(
          a => a.slug === ref.slug && a.plugin === ref.plugin,
        );
        if (!audit) {
          throw new Error(
            `Category has invalid ref - audit with slug ${ref.slug} not found in ${ref.plugin} plugin`,
          );
        }
        return audit.score;

      case 'group':
        group = groups.find(
          g => g.slug === ref.slug && g.plugin === ref.plugin,
        );
        if (!group) {
          throw new Error(
            `Category has invalid ref - group with slug ${ref.slug} not found in ${ref.plugin} plugin`,
          );
        }
        return group.score;
      default:
        throw new Error(`Type ${ref.type} is unknown`);
    }
  };
}

export function calculateScore(refs, scoreFn) {
  const numerator = refs.reduce(
    (sum, ref) => sum + scoreFn(ref) * ref.weight,
    0,
  );
  const denominator = refs.reduce((sum, ref) => sum + ref.weight, 0);
  return numerator / denominator;
}

export function scoreReportOptimized0(report) {
  const scoredPlugins = report.plugins.map(plugin => {
    const { groups, audits } = plugin;
    const preparedAudits = audits.map(audit => ({
      ...audit,
      plugin: plugin.slug,
    }));
    const preparedGroups =
      groups?.map(group => ({
        ...group,
        score: calculateScore(group.refs, groupRefToScore(preparedAudits)),
        plugin: plugin.slug,
      })) || [];

    return {
      ...plugin,
      audits: preparedAudits,
      groups: preparedGroups,
    };
  });

  const allScoredAudits = scoredPlugins.flatMap(({ audits }) => audits);
  const allScoredGroups = scoredPlugins.flatMap(({ groups }) => groups);

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
