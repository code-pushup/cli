import { PluginConfig, RunnerOutput } from '@quality-metrics/models';

type ESLintPluginConfig = {
  config: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function eslintPlugin({ config }: ESLintPluginConfig): PluginConfig {
  return {
    audits: [],
    runner: {
      command: 'bash',
      args: [
        '-c',
        `echo '${JSON.stringify({
          audits: [
            {
              slug: 'no-any',
              value: 0,
              displayValue: 'config: ' + JSON.stringify(config),
            },
          ],
        } satisfies RunnerOutput)}' > out.json`,
      ],
      outputPath: 'out.json',
    },
    meta: {
      slug: 'eslint',
      name: 'execute plugin',
    },
  };
}
