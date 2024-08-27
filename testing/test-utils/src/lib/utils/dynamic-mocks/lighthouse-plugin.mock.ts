import { join } from 'node:path';
import type {
  Audit,
  AuditReport,
  Group,
  PluginConfig,
  PluginReport,
} from '@code-pushup/models';
import {
  LIGHTHOUSE_AUDITS_CHANGES,
  LIGHTHOUSE_AUDITS_MAP,
  LIGHTHOUSE_AUDIT_SLUGS,
} from './lighthouse-audits.mock';
import { echoRunnerConfigMock } from './runner-config.mock';

export const LH_PLUGIN_GROUP_PERFORMANCE: Group = {
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

export const LH_PLUGIN_META: Omit<PluginConfig, 'audits' | 'runner'> = {
  slug: 'lighthouse',
  title: 'Lighthouse',
  icon: 'lighthouse',
  packageName: '@code-pushup/lighthouse-plugin',
  version: '0.1.0',
};

export function lighthousePluginConfigMock(outputDir = 'tmp'): PluginConfig {
  const audits = Object.values(LIGHTHOUSE_AUDITS_MAP).map(
    ({ slug, description, title, docsUrl }): Audit => ({
      slug,
      description,
      title,
      docsUrl,
    }),
  );
  return {
    ...LH_PLUGIN_META,
    runner: echoRunnerConfigMock(
      Object.values(LIGHTHOUSE_AUDITS_MAP),
      join(outputDir, 'lighthouse-out.json'),
    ),
    audits,
    groups: [LH_PLUGIN_GROUP_PERFORMANCE],
  };
}

export function lighthousePluginReportMock(): PluginReport {
  return {
    ...LH_PLUGIN_META,
    date: '2023-10-18T07:49:45.899Z',
    duration: 1234,
    audits: Object.values(LIGHTHOUSE_AUDITS_MAP),
    groups: [LH_PLUGIN_GROUP_PERFORMANCE],
  };
}

export function lighthousePluginReportAltMock(): PluginReport {
  return {
    ...lighthousePluginReportMock(),
    date: '2024-03-12T12:42:05.704Z',
    duration: 1212,
    audits: LIGHTHOUSE_AUDIT_SLUGS.map(
      (slug): AuditReport =>
        slug in LIGHTHOUSE_AUDITS_CHANGES
          ? {
              ...LIGHTHOUSE_AUDITS_MAP[slug],
              ...LIGHTHOUSE_AUDITS_CHANGES[slug],
            }
          : LIGHTHOUSE_AUDITS_MAP[slug],
    ),
  };
}
