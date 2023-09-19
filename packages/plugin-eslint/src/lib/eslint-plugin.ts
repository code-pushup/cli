import { PluginConfig, AuditOutputs } from '@quality-metrics/models';
import * as eslint from 'eslint';

type ESLintPluginConfig = {
  config: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function eslintPlugin(_: ESLintPluginConfig): PluginConfig {
  // This line is here to keep errors related to imports and engines
  eslint;
  return {
    audits: [],
    runner: {
      command: 'bash',
      args: [
        '-c',
        `echo '${JSON.stringify([
          {
            slug: 'no-any',
            value: 0,
            score: 0,
          },
        ] satisfies AuditOutputs)}' > out.json`,
      ],
      outputPath: 'out.json',
    },
    meta: {
      slug: 'eslint',
      title: 'execute plugin',
    },
  };
}
