import { join } from 'path';
import type { Group, PluginReport } from '@code-pushup/models';
import { Audit, PluginConfig } from '@code-pushup/models';
import { LIGHTHOUSE_AUDIT_REPORTS_MAP } from './lighthouse-audits.mock';
import { echoRunnerConfigMock } from './runner-config.mock';

const PLUGIN_GROUP_PERFORMANCE: Group = {
  slug: 'performance',
  title: 'Performance',
  refs: [
    {
      slug: 'first-contentful-paint',
      weight: 10,
    },
    {
      slug: 'largest-contentful-paint',
      weight: 25,
    },
    {
      slug: 'speed-index',
      weight: 10,
    },
    {
      slug: 'total-blocking-time',
      weight: 30,
    },
    {
      slug: 'cumulative-layout-shift',
      weight: 25,
    },
  ],
};

const lighthousePluginMeta: Omit<PluginConfig, 'audits' | 'runner'> = {
  slug: 'lighthouse',
  title: 'Lighthouse',
  icon: 'lighthouse',
  packageName: '@code-pushup/lighthouse-plugin',
  version: '0.1.0',
};

export function lighthousePluginConfigMock(outputDir = 'tmp'): PluginConfig {
  const audits = Object.values(LIGHTHOUSE_AUDIT_REPORTS_MAP).map(
    ({ slug, description, title, docsUrl }) =>
      ({
        slug,
        description,
        title,
        docsUrl,
      } satisfies Audit),
  );
  return {
    ...lighthousePluginMeta,
    runner: echoRunnerConfigMock(
      Object.values(LIGHTHOUSE_AUDIT_REPORTS_MAP),
      join(outputDir, 'lighthouse-out.json'),
    ),
    audits,
    groups: [PLUGIN_GROUP_PERFORMANCE],
  };
}

export function lighthousePluginReportMock(): PluginReport {
  return {
    ...lighthousePluginMeta,
    date: '2023-10-18T07:49:45.899Z',
    duration: 1234,
    audits: Object.values(LIGHTHOUSE_AUDIT_REPORTS_MAP),
    groups: [PLUGIN_GROUP_PERFORMANCE],
  };
}
