import { defaultConfig } from 'lighthouse';
import { join } from 'path';
import { PluginConfig } from '@code-pushup/models';
import { echoRunnerConfig } from '@code-pushup/models/testing';

type LighthousePluginConfig = {
  config: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function lighthousePlugin(_: LighthousePluginConfig): PluginConfig {
  // This line is here to have import and engines errors still present
  defaultConfig;
  return {
    audits: [
      {
        slug: 'largest-contentful-paint',
        title: 'Largest Contentful Paint',
      },
    ],
    runner: echoRunnerConfig(
      [
        {
          slug: 'largest-contentful-paint',
          value: 0,
          score: 0,
        },
      ],
      join('tmp', 'out.json'),
    ),
    slug: 'lighthouse',
    title: 'ChromeDevTools Lighthouse',
    icon: 'lighthouse',
  };
}
