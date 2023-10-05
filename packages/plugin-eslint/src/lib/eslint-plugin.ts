import { PluginConfig } from '@quality-metrics/models';
import { toArray } from '@quality-metrics/utils';
import { ESLint } from 'eslint';
import { name, version } from '../../package.json';
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
    // TODO: docsUrl (package README, once published)
    packageName: name,
    version,

    audits,

    // TODO: groups?
    // - could be `problem`/`suggestion`/`layout` if based on `meta.type`
    // - `meta.category` (deprecated, but still used by some) could also be a source of groups

    // TODO: implement actual runner which converts results to audits: https://github.com/flowup/quality-metrics-cli/issues/27
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
