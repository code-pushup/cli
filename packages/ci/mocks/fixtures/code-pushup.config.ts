import { glob } from 'glob';
import type { CoreConfig } from '@code-pushup/models';

const config: CoreConfig = {
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
        const paths = await glob('**/*.{js,ts}');
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
};

export default config;
