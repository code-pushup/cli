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

export function scoreReportOptimized3(report) {
  const allScoredAudits = report.plugins.flatMap(plugin => {
    const { audits } = plugin;
    return audits.map(audit => ({
      ...audit,
      plugin: plugin.slug,
    }));
  });

  const allScoredGroups = report.plugins.flatMap(plugin => {
    const { groups } = plugin;
    return (
      groups?.map(group => ({
        ...group,
        score: calculateScore(group.refs, groupRefToScore(allScoredAudits)),
        plugin: plugin.slug,
      })) || []
    );
  });

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

function categoryRefToScore(audits, groups) {
  // Create lookup objects
  const auditLookup = audits.reduce((lookup, audit) => {
    return {
      ...lookup,
      [`${audit.plugin}-${audit.slug}`]: audit,
    };
  }, {});

  const groupLookup = groups.reduce((lookup, group) => {
    return {
      ...lookup,
      [`${group.plugin}-${group.slug}`]: group,
    };
  }, {});

  return ref => {
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
