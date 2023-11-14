export function calculateScore(refs, scoreFn) {
  const numerator = refs.reduce(
    (sum, ref) => sum + scoreFn(ref) * ref.weight,
    0,
  );
  const denominator = refs.reduce((sum, ref) => sum + ref.weight, 0);
  return numerator / denominator;
}

export function scoreReportOptimized2(report) {
  let allScoredAuditsAndGroups = new Map();

  report.plugins.forEach(plugin => {
    const { groups, audits } = plugin;
    audits.forEach(audit =>
      allScoredAuditsAndGroups.set(`${plugin.slug}-${audit.slug}-audit`, {
        ...audit,
        plugin: plugin.slug,
      }),
    );

    function groupScoreFn(ref) {
      const score = allScoredAuditsAndGroups.get(
        `${plugin.slug}-${ref.slug}-audit`,
      )?.score;
      if (score == null) {
        throw new Error(
          `Group has invalid ref - audit with slug ${plugin.slug}-${ref.slug}-audit not found`,
        );
      }
      return score;
    }
    groups?.forEach(group => {
      allScoredAuditsAndGroups.set(`${plugin.slug}-${group.slug}-group`, {
        ...group,
        score: calculateScore(group.refs, groupScoreFn),
        plugin: plugin.slug,
      });
    });
  });

  function catScoreFn(ref) {
    const audit = allScoredAuditsAndGroups.get(
      `${ref.plugin}-${ref.slug}-${ref.type}`,
    );
    if (!audit) {
      throw new Error(
        `Category has invalid ref - audit with slug ${ref.plugin}-${ref.slug}-${ref.type} not found in ${ref.plugin} plugin`,
      );
    }
    return audit.score;
  }
  const scoredCategories = report.categories.reduce((categoryMap, category) => {
    categoryMap.set(category.slug, {
      ...category,
      score: calculateScore(category.refs, catScoreFn),
    });
    return categoryMap;
  }, new Map());

  return {
    ...report,
    categories: scoredCategories,
    plugins: allScoredAuditsAndGroups,
  };
}
