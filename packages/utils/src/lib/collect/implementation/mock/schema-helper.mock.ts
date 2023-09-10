import {
  AuditGroup,
  CategoryConfig,
  CoreConfig,
  PersistConfig,
  PluginConfig,
  PluginReport,
  Report,
  RunnerOutput,
  AuditResult,
} from '@quality-metrics/models';

const __pluginSlug__ = 'mock-plugin-slug';
const __auditSlug__ = 'mock-audit-slug';
const __groupSlug__ = 'mock-group-slug';
const __categorySlug__ = 'mock-category-slug';
const __outputPath__ = 'out-execute-plugin.json';
const randWeight = () => Math.floor(Math.random() * 10);
const randDuration = () => Math.floor(Math.random() * 1000);

export function mockPluginConfig(opt?: {
  pluginSlug?: string;
  auditSlug?: string | string[];
  groupSlug?: string | string[];
}): PluginConfig {
  const { groupSlug } = opt || {};
  let { pluginSlug, auditSlug } = opt || {};
  pluginSlug = pluginSlug || __pluginSlug__;
  auditSlug = auditSlug || __auditSlug__;
  const addGroups = groupSlug !== undefined;
  const outputPath = __outputPath__;

  const audits = Array.isArray(auditSlug)
    ? auditSlug.map(slug => mockAuditConfig({ auditSlug: slug }))
    : [mockAuditConfig({ auditSlug: pluginSlug + '/' + auditSlug })];

  let groups: AuditGroup[] = [];
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
            score: Math.random(),
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
  auditSlug = auditSlug || __auditSlug__;

  return {
    slug: auditSlug,
    title: 'audit title',
    description: 'audit description',
    label: 'mock audit label',
    docsUrl: 'http://www.my-docs.dev',
  };
}

export function mockPersistConfig(opt?: Partial<PersistConfig>): PersistConfig {
  let { outputPath, format } = opt || {};
  outputPath = outputPath || __outputPath__;
  format = format || [];
  return {
    outputPath,
    format,
  };
}

export function mockGroupConfig(opt?: {
  groupSlug?: string;
  auditSlug?: string | string[];
}): AuditGroup {
  let { groupSlug, auditSlug } = opt || {};
  groupSlug = groupSlug || __groupSlug__;
  auditSlug = auditSlug || __auditSlug__;
  return {
    slug: groupSlug,
    title: 'group title',
    description: 'group description',
    refs: Array.isArray(auditSlug)
      ? auditSlug.map(slug => ({
          slug,
          weight: randWeight(),
        }))
      : [
          {
            slug: auditSlug,
            weight: randWeight(),
          },
        ],
  };
}

export function mockCategory(opt?: {
  categorySlug?: string;
  pluginSlug?: string;
  auditSlug?: string | string[];
}): CategoryConfig {
  let { categorySlug, auditSlug, pluginSlug } = opt || {};
  auditSlug = auditSlug || __auditSlug__;
  pluginSlug = pluginSlug || __pluginSlug__;
  categorySlug = categorySlug || __categorySlug__;
  return {
    slug: categorySlug,
    title: `${categorySlug
      .split('-')
      .map(word => word.slice(0, 1).toUpperCase() + word.slice(1))
      .join(' ')}`,
    description: `This is the category description of ${categorySlug}. Enjoy dummy text and data to the full.`,
    refs: Array.isArray(auditSlug)
      ? auditSlug.map(slug => ({
          slug,
          type: 'audit',
          weight: randWeight(),
          plugin: pluginSlug + '',
        }))
      : [
          {
            slug: auditSlug,
            type: 'audit',
            weight: randWeight(),
            plugin: pluginSlug + '',
          },
        ],
  };
}

export function mockReport(opt?: {
  auditSlug?: string | string[];
  pluginSlug?: string;
}): Report {
  let { auditSlug, pluginSlug } = opt || {};
  auditSlug = auditSlug || __auditSlug__;
  pluginSlug = pluginSlug || __pluginSlug__;
  return {
    package: 'mock-package',
    version: '0.0.0',
    date: new Date().toDateString(),
    duration: randDuration(),
    plugins: [mockPluginReport({ auditSlug, pluginSlug })],
  };
}

export function mockPluginReport(opt?: {
  pluginSlug: string;
  auditSlug: string | string[];
}): PluginReport {
  let { auditSlug, pluginSlug } = opt || {};
  auditSlug = auditSlug || __auditSlug__;
  pluginSlug = pluginSlug || __pluginSlug__;
  return {
    date: new Date().toDateString(),
    duration: randDuration(),
    meta: {
      slug: pluginSlug,
      docsUrl: '',
      name: 'Mock plugin Name',
      icon: '',
    },
    audits: Array.isArray(auditSlug)
      ? auditSlug.map(a => mockAuditResult({ auditSlug: a }))
      : ([mockAuditResult({ auditSlug })] as any),
  };
}

export function mockAuditResult(opt?: { auditSlug: string }): AuditResult {
  let { auditSlug } = opt || {};
  auditSlug = auditSlug || __auditSlug__;
  return {
    slug: auditSlug,
    value: Math.floor(Math.random() * 100),
    score: Math.round(Math.random()),
  };
}

export function mockConfig(opt?: {
  outputPath?: string;
  categorySlug?: string | string[];
  pluginSlug?: string | string[];
  auditSlug?: string | string[];
  groupSlug?: string | string[];
}): CoreConfig {
  const { outputPath, pluginSlug, auditSlug, groupSlug, categorySlug } =
    opt || {};
  return {
    persist: mockPersistConfig({ outputPath }),
    plugins: Array.isArray(pluginSlug)
      ? pluginSlug.map(slug =>
          mockPluginConfig({ pluginSlug: slug, auditSlug }),
        )
      : [mockPluginConfig({ pluginSlug, auditSlug, groupSlug })],
    categories: Array.isArray(categorySlug)
      ? categorySlug.map(slug =>
          mockCategory({ categorySlug: slug, auditSlug }),
        )
      : [mockCategory({ categorySlug, auditSlug })],
  };
}
