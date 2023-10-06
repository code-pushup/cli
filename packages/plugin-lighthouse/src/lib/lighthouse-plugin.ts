import { AuditOutputs, PluginConfig } from '@code-pushup/models';
import { defaultConfig } from 'lighthouse';

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
    runner: {
      command: 'node',
      args: [
        '-e',
        `require('fs').writeFileSync('tmp/out.json', '${JSON.stringify([
          {
            slug: 'largest-contentful-paint',
            value: 0,
            score: 0,
          },
        ] satisfies AuditOutputs)}')`,
      ],
      outputPath: 'tmp/out.json',
    },
    slug: 'lighthouse',
    title: 'ChromeDevTools Lighthouse',
    icon: 'lighthouse',
  };
}
