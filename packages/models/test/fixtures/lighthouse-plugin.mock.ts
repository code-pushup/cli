import type { PluginReport } from '../../src';
import { Audit, PluginConfig } from '../../src';
import { LIGHTHOUSE_AUDITS_MAP } from './lighthouse-audits.mock';
import { runnerConfig } from './runner.mock';

const lighthousePluginMeta: Omit<PluginConfig, 'audits'> = {
  slug: 'lighthouse',
  title: 'Lighthouse',
  icon: 'lighthouse',
  packageName: '@code-pushup/lighthouse-plugin',
  version: '0.1.0',
};

export function lighthousePluginConfig(): PluginConfig {
  const audits = Object.values(LIGHTHOUSE_AUDITS_MAP).map(
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
    runner: runnerConfig(audits),
    audits,
  };
}

export function lighthousePluginReport(): PluginReport {
  return {
    ...lighthousePluginMeta,
    date: '2023-10-18T07:49:45.899Z',
    duration: 1234,
    groups: [
      {
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
      },
    ],
    audits: Object.values(LIGHTHOUSE_AUDITS_MAP),
  };
}
