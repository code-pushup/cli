import { AuditOutputs, PluginConfig } from '@quality-metrics/models';
import * as eslint from 'eslint';

type ESLintPluginConfig = {
  config: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function eslintPlugin(_: ESLintPluginConfig): PluginConfig {
  // This line is here to keep errors related to imports and engines
  eslint;
  return {
    audits: [
      {
        slug: 'no-any',
        title: 'No any type',
      },
    ],
    runner: {
      command: 'node',
      args: [
        '-e',
        `require('fs').writeFileSync('out.json', '${JSON.stringify([
          {
            slug: 'no-any',
            title: 'No any type',
            value: 0,
            score: 0,
          },
        ] satisfies AuditOutputs)}')`,
      ],
      outputPath: 'out.json',
    },
    slug: 'eslint',
    title: 'execute plugin',
  };
}
