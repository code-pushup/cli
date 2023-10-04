import { PluginConfig } from '@quality-metrics/models';
import { toArray } from '@quality-metrics/utils';
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
    // TODO: docsUrl (package README)
    audits,
    runner: {
      command: 'npx',
      args: [
        'eslint',
        `--config=${eslintrc}`,
        '--format=json',
        '--output-file=tmp/out.json',
        ...toArray(patterns),
      ],
      outputPath: 'tmp/out.json',
    },
  };
}
