import { CategoryConfig } from '../src/lib/category-config';
import { CoreConfig } from '../src/lib/core-config';
import { PersistConfig } from '../src/lib/persist-config';
import {
  AuditGroup,
  AuditMetadata,
  PluginConfig,
  RunnerOutput,
} from '../src/lib/plugin-config';
import { UploadConfig } from '../src/lib/upload-config';

export function mockConfig(opt?: {
  pluginSlug?: string | string[];
  auditSlug?: string | string[];
  groupSlug?: string | string[];
}): CoreConfig {
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
  outputPath?: string;
}): PluginConfig {
  const { groupSlug } = opt || {};
  let { pluginSlug, auditSlug, outputPath } = opt || {};
  pluginSlug = pluginSlug || 'mock-plugin-slug';
  auditSlug = auditSlug || 'mock-audit-slug';
  const addGroups = groupSlug !== undefined;
  outputPath = outputPath || 'out-execute-plugin.json';

  const audits = Array.isArray(auditSlug)
    ? auditSlug.map(slug => mockAuditConfig({ auditSlug: slug }))
    : [mockAuditConfig({ auditSlug })];

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

export function mockAuditConfig(opt?: { auditSlug?: string }): AuditMetadata {
  let { auditSlug } = opt || {};
  auditSlug = auditSlug || 'mock-audit-slug';

  return {
    slug: auditSlug,
    title: 'audit title',
    description: 'audit description',
    docsUrl: 'http://www.my-docs.dev',
  };
}

export function mockAuditRef(opt?: {
  pluginSlug?: string;
  auditSlug?: string;
}): CategoryConfig['refs'][0] {
  const { auditSlug = 'mock-audit-slug', pluginSlug = 'mock-plugin-slug' } =
    opt || {};

  return {
    type: 'audit',
    slug: auditSlug,
    plugin: pluginSlug,
    weight: 0,
  };
}

export function mockGroupConfig(opt?: {
  groupSlug?: string;
  auditSlug?: string | string[];
}): AuditGroup {
  let { groupSlug, auditSlug } = opt || {};
  groupSlug = groupSlug || 'mock-group-slug';
  auditSlug = auditSlug || 'mock-audit-slug';
  const refs = Array.isArray(auditSlug)
    ? auditSlug.map(slug => ({ slug, weight: 0 }))
    : [{ slug: auditSlug, weight: 0 }];
  return {
    slug: groupSlug,
    title: 'group title',
    description: 'group description',
    refs,
  };
}

type WeightlessRef = Omit<CategoryConfig['refs'][0], 'weight'>;

export function mockCategory(opt?: {
  categorySlug?: string;
  auditRefOrGroupRef?: WeightlessRef | WeightlessRef[];
}): CategoryConfig {
  let { auditRefOrGroupRef, categorySlug } = opt || {};
  categorySlug = categorySlug || 'mock-category-slug';
  auditRefOrGroupRef = auditRefOrGroupRef || mockAuditRef();

  const refs = (
    Array.isArray(auditRefOrGroupRef)
      ? auditRefOrGroupRef
      : [auditRefOrGroupRef]
  ).map(ref => ({ ...ref, weight: 0 }));

  return {
    slug: categorySlug,
    title: 'Mock category title',
    description: 'mock description',
    refs,
  };
}

export function mockUploadConfig(opt?: Partial<UploadConfig>): UploadConfig {
  return {
    apiKey: 'm0ck-API-k3y',
    server: 'http://test.server.io',
    ...opt,
  };
}
export function mockPersistConfig(opt?: Partial<PersistConfig>): PersistConfig {
  return {
    outputPath: 'mock-output-path.json',
    ...opt,
  };
}

export function mockRunnerOutput(opt?: {
  auditSlug: string | string[];
}): RunnerOutput {
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
