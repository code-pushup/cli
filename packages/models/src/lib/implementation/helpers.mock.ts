import { PluginConfigSchema } from '../plugin-config';
import { RunnerOutputSchema } from '../output';
import { CoreConfigSchema } from '../core-config';
import { CategoryConfigSchema } from '../category-config';
import { UploadConfigSchema } from '../upload-config';
import { PersistConfigSchema } from '../persist-config';

export function mockConfig(opt?: {
  pluginSlug?: string | string[];
  auditSlug?: string | string[];
  groupSlug?: string | string[];
}): CoreConfigSchema {
  let { pluginSlug, auditSlug, groupSlug } = opt || {};
  pluginSlug = pluginSlug || 'mock-plugin-slug';
  auditSlug = auditSlug || 'mock-audit-slug';
  groupSlug = groupSlug || 'mock-group-slug';
  return {
    persist: { outputPath: 'command-object-config-out.json' },
    plugins: Array.isArray(pluginSlug)
      ? pluginSlug.map(p => mockPluginConfig({ pluginSlug: p, auditSlug }))
      : [mockPluginConfig({ pluginSlug, auditSlug, groupSlug })],
    categories: [],
  };
}

export function mockPluginConfig(opt?: {
  pluginSlug?: string;
  auditSlug?: string | string[];
  groupSlug?: string | string[];
}): PluginConfigSchema {
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
            slug: `${pluginSlug}#${slug}`,
            value: parseFloat('0.' + idx),
          })),
        } satisfies RunnerOutputSchema)}' > ${outputPath}`,
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
}): PluginConfigSchema['audits'][0] {
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
export function mockMetric(opt?: {
  auditRef?: string;
}): CategoryConfigSchema['metrics'][0] {
  const { auditRef } = opt || {};
  const ref = auditRef || 'mock-plugin-slug#mock-audit-slug';

  return {
    ref,
    weight: 0,
  };
}

export function mockGroupConfig(opt?: {
  groupSlug?: string;
  auditSlug?: string | string[];
}): PluginConfigSchema['groups'][0] {
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
}): CategoryConfigSchema {
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

export function mockUploadConfig(
  opt?: Partial<UploadConfigSchema>,
): UploadConfigSchema {
  return {
    apiKey: 'm0ck-API-k3y',
    server: 'http://test.server.io',
    ...opt,
  };
}
export function mockPersistConfig(
  opt?: Partial<PersistConfigSchema>,
): PersistConfigSchema {
  return {
    outputPath: 'mock-output-path.json',
    ...opt,
  };
}

export function mockRunnerOutput(opt?: {
  auditSlug: string | string[];
}): RunnerOutputSchema {
  let { auditSlug } = opt || {};
  auditSlug = auditSlug || 'mock-audit-output-slug';
  const audits = Array.isArray(auditSlug)
    ? auditSlug.map((slug, idx) => ({
        slug,
        value: idx,
        displayValue: '',
        score: 0,
      }))
    : [
        {
          slug: auditSlug,
          value: 12,
          displayValue: '',
          score: 0,
        },
      ];

  return {
    audits,
  };
}
