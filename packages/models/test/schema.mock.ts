import {
  AuditGroup,
  Audit,
  CategoryConfig,
  CoreConfig,
  PersistConfig,
  PluginConfig,
  PluginReport,
  Report,
  AuditOutputs,
  AuditReport,
  UploadConfig,
  AuditOutput,
  Issue,
} from '../src/index';

const __pluginSlug__ = 'mock-plugin-slug';
const __auditSlug__ = 'mock-audit-slug';
const __groupSlug__ = 'mock-group-slug';
const __categorySlug__ = 'mock-category-slug';
const __pluginOutputPath__ = 'out-execute-plugin.json';
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
  const pluginOutputPath = __pluginOutputPath__;

  const audits = Array.isArray(auditSlug)
    ? auditSlug.map(slug => mockAuditConfig({ auditSlug: slug }))
    : [mockAuditConfig({ auditSlug: auditSlug })];

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
        `echo '${JSON.stringify(
          audits.map(({ slug }, idx) => ({
            slug: `${slug}`,
            title: 'Title of ' + slug,
            value: idx,
            score: parseFloat('0.' + idx),
          })) satisfies AuditOutputs,
        )}' > ${pluginOutputPath}`,
      ],
      outputPath: pluginOutputPath,
    },
    slug: pluginSlug,
    title: 'execute plugin',
    description: 'Plugin description for ' + pluginSlug,
    docsUrl: 'https://my-plugin.docs.dev?' + pluginSlug,
  };
}

export function mockAuditConfig(opt?: { auditSlug?: string }): Audit {
  let { auditSlug } = opt || {};
  auditSlug = auditSlug || __auditSlug__;

  return {
    slug: auditSlug,
    title: auditSlug + ' title',
    description: 'audit description',
    docsUrl: 'http://www.my-docs.dev',
  } satisfies Required<Audit>;
}

export function mockPersistConfig(opt?: Partial<PersistConfig>): PersistConfig {
  let { outputPath, format } = opt || {};
  outputPath = outputPath || __pluginOutputPath__;
  format = format || [];
  return {
    outputPath,
    format,
  } satisfies Required<PersistConfig>;
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
    docsUrl: 'https://my-group.docs.dev?' + groupSlug,
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
  } satisfies Required<AuditGroup>;
}

export function mockCategory(opt?: {
  categorySlug?: string;
  pluginSlug?: string;
  auditSlug?: string | string[];
  groupSlug?: string | string[];
}): CategoryConfig {
  let { categorySlug, auditSlug, pluginSlug, groupSlug } = opt || {};
  const addAudits = !!auditSlug;
  auditSlug = auditSlug || __auditSlug__;
  const addGroups = !!groupSlug;
  groupSlug = groupSlug || __groupSlug__;
  pluginSlug = pluginSlug || __pluginSlug__;
  categorySlug = categorySlug || __categorySlug__;

  const categoryAuditRefs: CategoryConfig['refs'] = addAudits
    ? Array.isArray(auditSlug)
      ? auditSlug.map(slug => ({
          slug,
          type: 'audit' as const,
          weight: randWeight(),
          plugin: pluginSlug + '',
        }))
      : [
          {
            slug: auditSlug,
            type: 'audit' as const,
            weight: randWeight(),
            plugin: pluginSlug + '',
          },
        ]
    : [];
  const categoryGroupRefs: CategoryConfig['refs'] = addGroups
    ? Array.isArray(groupSlug)
      ? groupSlug.map(slug => ({
          slug,
          type: 'group',
          weight: randWeight(),
          plugin: pluginSlug + '',
        }))
      : [
          {
            slug: groupSlug,
            type: 'group',
            weight: randWeight(),
            plugin: pluginSlug + '',
          },
        ]
    : [];

  return {
    slug: categorySlug,
    title: `${categorySlug
      .split('-')
      .map(word => word.slice(0, 1).toUpperCase() + word.slice(1))
      .join(' ')}`,
    description: `This is the category description of ${categorySlug}. Enjoy dummy text and data to the full.`,
    docsUrl: 'https://category.dev?' + categorySlug,
    refs: categoryAuditRefs.concat(categoryGroupRefs),
  } satisfies Required<CategoryConfig>;
}

export function mockReport(opt?: {
  auditSlug?: string | string[];
  pluginSlug?: string;
}): Report {
  let { auditSlug, pluginSlug } = opt || {};
  auditSlug = auditSlug || __auditSlug__;
  pluginSlug = pluginSlug || __pluginSlug__;
  return {
    packageName: 'mock-package',
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
    slug: pluginSlug,
    title: 'Mock plugin Name',
    description: 'Plugin description of ' + pluginSlug,
    docsUrl: `http://plugin.io/docs/${pluginSlug}`,
    icon: 'socket',
    audits: Array.isArray(auditSlug)
      ? auditSlug.map(a => mockAuditReport({ auditSlug: a }))
      : [mockAuditReport({ auditSlug })],
  } satisfies Required<PluginReport>;
}

export function mockAuditReport(opt?: { auditSlug: string }): AuditReport {
  let { auditSlug } = opt || {};
  auditSlug = auditSlug || __auditSlug__;
  return {
    ...(mockAuditOutput({ auditSlug }) as Required<AuditOutput>),
  } satisfies Required<AuditReport>;
}

export function mockCoreConfig(opt?: {
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
    upload: mockUploadConfig(),
    plugins: Array.isArray(pluginSlug)
      ? pluginSlug.map(slug =>
          mockPluginConfig({ pluginSlug: slug, auditSlug, groupSlug }),
        )
      : [mockPluginConfig({ pluginSlug, auditSlug, groupSlug })],
    categories: Array.isArray(categorySlug)
      ? categorySlug.map(slug =>
          mockCategory({ categorySlug: slug, auditSlug, groupSlug }),
        )
      : [mockCategory({ categorySlug, auditSlug, groupSlug })],
  } satisfies Required<CoreConfig>;
}

export function mockUploadConfig(opt?: Partial<UploadConfig>): UploadConfig {
  return {
    apiKey: 'm0ck-API-k3y',
    server: 'http://test.server.io',
    ...opt,
  };
}

export function mockAuditOutputs(opt?: {
  auditSlug: string | string[];
}): AuditOutputs {
  let { auditSlug } = opt || {};
  auditSlug = auditSlug || 'mock-audit-output-slug';
  return Array.isArray(auditSlug)
    ? auditSlug.map((slug, idx) => mockAuditOutput({ auditSlug: slug }))
    : [mockAuditOutput({ auditSlug })];
}

export function mockAuditOutput(opt?: { auditSlug: string }): AuditOutput {
  let { auditSlug } = opt || {};
  auditSlug = auditSlug || 'mock-audit-output-slug';
  return {
    slug: auditSlug,
    title: 'Title of ' + auditSlug,
    description: 'Description of ' + auditSlug,
    docsUrl: 'https://audit.dev?' + auditSlug,
    details: {
      issues: [mockIssueOutput()],
    },
    value: 12,
    displayValue: '',
    score: 0,
  } satisfies Required<AuditOutput>;
}

export function mockIssueOutput(): Issue {
  return {
    severity: 'error',
    message: '',
    source: {
      file: 'the-file.ts',
      position: {
        startLine: 1,
        startColumn: 2,
        endLine: 3,
        endColumn: 4,
      },
    },
  } satisfies Required<Issue>;
}
