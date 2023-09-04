import {PluginConfigSchema} from "../plugins";
import {RunnerOutputSchema} from "../plugin-output";
import {CoreConfigSchema} from "../core-config";
import {CategoryConfigSchema} from "../category-config";

export function mockConfig(
  opt?: { pluginSlug?: string | string[], auditSlug?: string | string[], groupSlug?: string | string[]  },
): CoreConfigSchema {
  let {pluginSlug, auditSlug, groupSlug} = opt || {};
  pluginSlug = pluginSlug || 'mock-plugin-slug';
  auditSlug = auditSlug || 'mock-audit-slug';
  groupSlug = groupSlug || 'mock-group-slug';
  return {
    persist: {outputPath: 'command-object-config-out.json'},
    plugins: Array.isArray(pluginSlug) ?
      pluginSlug.map(p => mockPluginConfig({pluginSlug: p, auditSlug})) : [mockPluginConfig({pluginSlug, auditSlug, groupSlug})],
    categories: [],
  }
}

export function mockPluginConfig(
  opt?: { pluginSlug?: string, auditSlug?: string | string[], groupSlug?: string | string[] },
): PluginConfigSchema {
  let {pluginSlug, auditSlug, groupSlug} = opt || {};
  pluginSlug = pluginSlug || 'mock-plugin-slug';
  auditSlug = auditSlug || 'mock-audit-slug';
  groupSlug = groupSlug || 'mock-group-slug';
  const outputPath = 'out-execute-plugin.json';

  const audits = Array.isArray(auditSlug) ?
    auditSlug.map(slug => mockAuditConfig({auditSlug: slug})) : [mockAuditConfig({auditSlug})];
  const groups = Array.isArray(groupSlug) ?
    groupSlug.map(slug => mockGroupConfig({groupSlug: slug})) : [mockGroupConfig({groupSlug})];
  return {
    audits,
    runner: {
      command: 'bash',
      args: [
        '-c',
        `echo '${JSON.stringify({
          audits: audits.map(({slug}, idx) => ({
            slug,
            value: parseFloat('0.' + idx)
          })),
        } satisfies RunnerOutputSchema)}' > ${outputPath}`,
      ],
      outputPath: outputPath,
    },
    groups: groups,
    meta: {
      slug: pluginSlug,
      name: 'execute plugin',
      type: 'static-analysis'
    },
  };
}

export function mockAuditConfig(
  opt?: { auditSlug?: string },
): PluginConfigSchema['audits'][0] {
  let {auditSlug} = opt || {};
  auditSlug = auditSlug || 'mockAuditSlug';

  return {
    slug: auditSlug,
    title: 'audit title',
    description: 'audit description',
    label: 'mock audit lable',
    docsUrl: 'http://www.google.com'
  }
}

export function mockGroupConfig(
  opt?: { groupSlug?: string, auditSlug?: string | string[] },
): PluginConfigSchema['groups'][0] {
  let {groupSlug, auditSlug} = opt || {};
  groupSlug = groupSlug || 'mock-group-slug';
  auditSlug = auditSlug || 'mock-audit-slug';
  const audits = Array.isArray(auditSlug) ?
    auditSlug.map(slug => ({ref: slug,  weight: 0})) : [{ref: auditSlug,  weight: 0}];
  return {
    slug: groupSlug,
    title: 'group title',
    description: 'group description',
    audits: audits
  }
}


export function mockCategory(
  opt?: { categorySlug?: string, auditRef?: string | string[] }
): CategoryConfigSchema {
  let {auditRef, categorySlug} = opt || {};
  categorySlug = categorySlug || 'mock-category-slug';
  auditRef = auditRef || 'mock-audit-ref';

  return {
    slug: categorySlug,
    title: 'Mock category title',
    description: 'mock description',
    metrics: Array.isArray(auditRef) ? auditRef.map(ref => ({
      ref,
      weight: 0
    })) : [{
      ref: auditRef,
      weight: 0
    }]
  }
}


export function mockRunnerOutput(
  opt?: { auditSlug: string },
): RunnerOutputSchema {
  let {auditSlug} = opt || {};
  auditSlug = auditSlug || 'mock-audit-output-slug';
  const audits = Array.isArray(auditSlug) ?
    auditSlug.map((slug, idx) => ({
      slug: auditSlug,
      value: idx,
      displayValue: '',
      score: 0
    })) : [{
      slug: auditSlug,
      value: 12,
      displayValue: '',
      score: 0
    }];

  return {
    audits
  }
}
