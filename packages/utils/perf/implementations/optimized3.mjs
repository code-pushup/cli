export function calculateScore(refs, scoreFn) {
  const { numerator, denominator } = refs.reduce(
    (acc, ref) => {
      const score = scoreFn(ref);
      return {
        numerator: acc.numerator + score * ref.weight,
        denominator: acc.denominator + ref.weight,
      };
    },
    { numerator: 0, denominator: 0 },
  );
  return numerator / denominator;
}

export function deepClone(obj) {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }

  const cloned = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

export function scoreReportOptimized3(report) {
  const scoredReport = deepClone(report);
  const allScoredAuditsAndGroups = new Map();

  scoredReport.plugins.forEach(plugin => {
    const { audits } = plugin;
    const groups = plugin.groups || [];

    audits.forEach(audit => {
      const key = `${plugin.slug}-${audit.slug}-audit`;
      audit.plugin = plugin.slug;
      allScoredAuditsAndGroups.set(key, audit);
    });

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

    groups.forEach(group => {
      const key = `${plugin.slug}-${group.slug}-group`;
      group.score = calculateScore(group.refs, groupScoreFn);
      group.plugin = plugin.slug;
      allScoredAuditsAndGroups.set(key, group);
    });
    plugin.groups = groups;
  });

  function catScoreFn(ref) {
    const key = `${ref.plugin}-${ref.slug}-${ref.type}`;
    const item = allScoredAuditsAndGroups.get(key);
    if (!item) {
      throw new Error(
        `Category has invalid ref - ${ref.type} with slug ${key} not found in ${ref.plugin} plugin`,
      );
    }
    return item.score;
  }

  const scoredCategoriesMap = new Map();

  for (const category of scoredReport.categories) {
    category.score = calculateScore(category.refs, catScoreFn);
    scoredCategoriesMap.set(category.slug, category);
  }

  scoredReport.categories = Array.from(scoredCategoriesMap.values());

  return scoredReport;
}
