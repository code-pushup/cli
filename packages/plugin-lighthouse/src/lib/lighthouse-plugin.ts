import { defaultConfig } from 'lighthouse';
import { join } from 'node:path';
import { PluginConfig } from '@code-pushup/models';
import { echoRunnerConfigMock } from '@code-pushup/testing-utils';

type LighthousePluginConfig = {
  config: string;
};

const outputDir = 'tmp';
const outputFile = join(outputDir, `out.${Date.now()}.json`);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function lighthousePlugin(_: LighthousePluginConfig): PluginConfig {
  // This line is here to have import and engines errors still present
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  defaultConfig;
  return {
    slug: 'lighthouse',
    title: 'ChromeDevTools Lighthouse',
    icon: 'lighthouse',
    audits: [
      {
        slug: 'largest-contentful-paint',
        title: 'Largest Contentful Paint',
      },
    ],
    runner: echoRunnerConfigMock(
      [
        {
          slug: 'largest-contentful-paint',
          value: 0,
          score: 0,
        },
      ],
      outputFile,
    ),
  };
}
