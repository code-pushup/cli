import {
  CategoryConfig,
  PluginConfig,
  RunnerOutput,
} from '@quality-metrics/models';

export function mockPluginConfig(opt?: {
  pluginSlug?: string;
  auditSlug?: string | string[];
  groupSlug?: string | string[];
}): PluginConfig {
  const { groupSlug } = opt || {};
  let { pluginSlug, auditSlug } = opt || {};
  pluginSlug = pluginSlug || 'mock-plugin-slug';
  auditSlug = auditSlug || 'mock-audit-slug';
  const addGroups = groupSlug !== undefined;
  const outputPath = 'out-execute-plugin.json';

  const audits = Array.isArray(auditSlug)
    ? auditSlug.map(slug => mockAuditConfig({ auditSlug: slug }))
    : [mockAuditConfig({ auditSlug })];

  let groups = [];
  if (addGroups) {
    groups = Array.isArray(groupSlug)
      ? groupSlug.map(slug => mockGroupConfig({ groupSlug: slug }))
      : [mockGroupConfig({ groupSlug, auditSlug })];
  }

  return {
    audits,
    groups,
    runner: {
      command: 'bash',
      args: [
        '-c',
        `echo '${JSON.stringify({
          audits: audits.map(({ slug }, idx) => ({
            slug: `${slug}`,
            value: parseFloat('0.' + idx),
          })),
        } satisfies RunnerOutput)}' > ${outputPath}`,
      ],
      outputPath: outputPath,
    },
    meta: {
      slug: pluginSlug,
      name: 'execute plugin',
    },
  };
}

export function mockAuditConfig(opt?: {
  auditSlug?: string;
}): PluginConfig['audits'][0] {
  let { auditSlug } = opt || {};
  auditSlug = auditSlug || 'mock-audit-slug';

  return {
    slug: auditSlug,
    title: 'audit title',
    description: 'audit description',
    label: 'mock audit label',
    docsUrl: 'http://www.my-docs.dev',
  };
}

export function mockGroupConfig(opt?: {
  groupSlug?: string;
  auditSlug?: string | string[];
}): PluginConfig['groups'][0] {
  let { groupSlug, auditSlug } = opt || {};
  groupSlug = groupSlug || 'mock-group-slug';
  auditSlug = auditSlug || 'mock-audit-slug';
  const audits = Array.isArray(auditSlug)
    ? auditSlug.map(slug => ({ ref: slug, weight: 0 }))
    : [{ ref: auditSlug, weight: 0 }];
  return {
    slug: groupSlug,
    title: 'group title',
    description: 'group description',
    audits: audits,
  };
}

export function mockCategory(opt?: {
  categorySlug?: string;
  auditRefOrGroupRef?: string | string[];
}): CategoryConfig {
  let { auditRefOrGroupRef, categorySlug } = opt || {};
  categorySlug = categorySlug || 'mock-category-slug';
  auditRefOrGroupRef = auditRefOrGroupRef || 'mock-plugin-slug#mock-audit-slug';

  const metrics = Array.isArray(auditRefOrGroupRef)
    ? auditRefOrGroupRef.map(ref => ({ ref: ref, weight: 0 }))
    : [{ ref: auditRefOrGroupRef, weight: 0 }];

  return {
    slug: categorySlug,
    title: 'Mock category title',
    description: 'mock description',
    metrics,
  };
}
