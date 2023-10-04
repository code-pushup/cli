import { AuditOutputs, PluginConfig } from '@quality-metrics/models';
import { objectToCliArgs } from '@quality-metrics/utils';
import { ESLint } from 'eslint';
import { listAudits } from './meta/audits';

export type ESLintPluginConfig = {
  eslintrc: string;
  patterns: string | string[];
};

export async function eslintPlugin({
  eslintrc,
  patterns,
}: ESLintPluginConfig): Promise<PluginConfig> {
  const eslint = new ESLint({
    useEslintrc: false,
    baseConfig: { extends: eslintrc },
  });

  const audits = await listAudits(eslint, patterns);

  return {
    slug: 'eslint',
    title: 'ESLint',
    icon: 'eslint',
    description: 'Official Code PushUp ESLint plugin',
    // TODO: docsUrl
    audits,
    runner: {
      command: 'node',
      args: objectToCliArgs({
        e: `require('fs').writeFileSync('tmp/out.json', '${JSON.stringify([
          {
            slug: 'no-any',
            title: 'No any type',
            value: 0,
            score: 0,
          },
        ] satisfies AuditOutputs)}')`,
      }),
      outputPath: 'tmp/out.json',
    },
  };
}
