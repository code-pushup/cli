import { CategoryConfigRefType } from '@code-pushup/portal-client';
import {
  AuditGroup,
  AuditReport,
  CategoryConfig,
  CoreConfig,
  PersistConfig,
  PluginConfig,
  PluginReport,
  Report,
} from '@code-pushup/models';

const __pluginSlug__ = 'mock-plugin-slug';
const __auditSlug__ = 'mock-audit-slug';
const __groupSlug__ = 'mock-group-slug';
const __categorySlug__ = 'mock-category-slug';
const __outputDir__ = 'tmp';
const __outputFile__ = `${__outputDir__}/out-execute-plugin.json`;
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
  const outputFile = __outputFile__;

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
      command: 'node',
      args: [
        '-e',
        `require('fs').writeFileSync('${outputFile}', '${JSON.stringify(
          audits.map(
            ({ slug }) =>
              mockAuditReport({ auditSlug: slug }) satisfies AuditReport,
          ),
        )}')`,
      ],
      outputFile,
    },
    slug: pluginSlug,
    title: 'execute plugin ' + pluginSlug,
    docsUrl: 'https://plugin.dev?' + pluginSlug,
    description: 'my plugin description of ' + pluginSlug,
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
    docsUrl: 'http://www.my-docs.dev',
  };
}

export function mockPersistConfig(opt?: Partial<PersistConfig>): PersistConfig {
  let { outputDir, format } = opt || {};
  outputDir = outputDir || __outputDir__;
  format = format || [];
  return {
    outputDir,
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
          type: CategoryConfigRefType.Audit,
          weight: randWeight(),
          plugin: pluginSlug + '',
        }))
      : [
          {
            slug: auditSlug,
            type: CategoryConfigRefType.Audit,
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
    packageName: 'mock-package',
    version: '0.0.0',
    date: new Date().toDateString(),
    duration: randDuration(),
    categories: [
      mockCategory({ pluginSlug, auditSlug, categorySlug: 'test-category' }),
    ],
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
    docsUrl: `http://plugin.io/docs/${pluginSlug}`,
    title: 'Mock plugin Name',
    icon: 'nrwl',
    audits: Array.isArray(auditSlug)
      ? auditSlug.map(a => mockAuditReport({ auditSlug: a }))
      : [mockAuditReport({ auditSlug })],
  };
}

export function mockAuditReport(opt?: { auditSlug: string }): AuditReport {
  let { auditSlug } = opt || {};
  auditSlug = auditSlug || __auditSlug__;
  return {
    slug: auditSlug,
    displayValue: 'mocked value',
    value: Math.floor(Math.random() * 100),
    score: Math.round(Math.random()),
    title: auditSlug,
  };
}

export function mockConfig(opt?: {
  outputDir?: string;
  categorySlug?: string | string[];
  pluginSlug?: string | string[];
  auditSlug?: string | string[];
  groupSlug?: string | string[];
}): CoreConfig {
  const { outputDir, pluginSlug, auditSlug, groupSlug, categorySlug } =
    opt || {};
  return {
    persist: mockPersistConfig({ outputDir }),
    plugins: Array.isArray(pluginSlug)
      ? pluginSlug.map(slug =>
          mockPluginConfig({ pluginSlug: slug, auditSlug, groupSlug }),
        )
      : [mockPluginConfig({ pluginSlug, auditSlug, groupSlug })],
    categories: Array.isArray(categorySlug)
      ? categorySlug.map(slug =>
          mockCategory({ categorySlug: slug, auditSlug }),
        )
      : [mockCategory({ categorySlug, auditSlug })],
  };
}
