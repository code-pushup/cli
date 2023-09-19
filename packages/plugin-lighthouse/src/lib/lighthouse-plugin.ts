import { defaultConfig } from 'lighthouse';
import { PluginConfig, AuditOutputs } from '@quality-metrics/models';

type LighthousePluginConfig = {
  config: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function lighthousePlugin(_: LighthousePluginConfig): PluginConfig {
  // This line is here to have import and engines errors still present
  defaultConfig;
  return {
    audits: [],
    runner: {
      command: 'bash',
      args: [
        '-c',
        `echo '${JSON.stringify([
          {
            slug: 'largest-contentful-paint',
            value: 0,
            score: 0,
          },
        ] satisfies AuditOutputs)}' > out.json`,
      ],
      outputPath: 'out.json',
    },
    meta: {
      slug: 'lighthouse',
      name: 'ChromeDevTools Lighthouse',
    },
  };
}
