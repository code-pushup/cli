import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crawlFileSystem } from '@code-pushup/utils';

export function resolveConfig(url) {
  const directory = fileURLToPath(dirname(url));
  return {
    persist: {
      outputDir: join(directory, '.code-pushup'),
    },
    plugins: [
      {
        slug: 'ts-migration',
        title: 'TypeScript migration',
        icon: 'typescript',
        audits: [
          {
            slug: 'ts-files',
            title: 'Source files converted from JavaScript to TypeScript',
          },
        ],
        runner: async () => {
          const paths = await crawlFileSystem({
            directory,
            pattern: /\.[jt]s$/,
          });
          const jsPaths = paths.filter(path => path.endsWith('.js'));
          const tsPaths = paths.filter(path => path.endsWith('.ts'));
          const jsFileCount = jsPaths.length;
          const tsFileCount = tsPaths.length;
          const ratio = tsFileCount / (jsFileCount + tsFileCount);
          const percentage = Math.round(ratio * 100);
          return [
            {
              slug: 'ts-files',
              value: percentage,
              score: ratio,
              displayValue: `${percentage}% converted`,
              details: {
                issues: jsPaths.map(file => ({
                  message: 'Use .ts file extension instead of .js',
                  severity: 'warning',
                  source: { file },
                })),
              },
            },
          ];
        },
      },
    ],
    categories: [
      {
        slug: 'ts-migration',
        title: 'TypeScript migration',
        refs: [
          {
            type: 'audit',
            plugin: 'ts-migration',
            slug: 'ts-files',
            weight: 1,
          },
        ],
      },
    ],
  };
}
