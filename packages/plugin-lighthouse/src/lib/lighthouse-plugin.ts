import { defaultConfig } from 'lighthouse';
import { AuditOutputs, PluginConfig } from '@code-pushup/models';
import {join} from "path";

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
        'echo',
        `require('fs').writeFileSync(require('path').join('tmp', 'out.json')), '${JSON.stringify([
          {
            slug: 'largest-contentful-paint',
            value: 0,
            score: 0,
          },
        ] satisfies AuditOutputs)}')`,
      ],
      outputFile: join('tmp', 'out.json'),
    },
    slug: 'lighthouse',
    title: 'ChromeDevTools Lighthouse',
    icon: 'lighthouse',
  };
}
