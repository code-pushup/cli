import { CoreConfig } from '../../src';
import { auditReport } from './plugin-config.mock';
import { runnerConfig } from './runner.mock';

const outputDir = 'tmp';
export default {
  upload: {
    organization: 'code-pushup',
    project: 'cli',
    apiKey: 'dummy-api-key',
    server: 'https://example.com/api',
  },
  persist: { outputDir },
  plugins: [
    {
      audits: [
        {
          slug: 'mock-audit-slug',
          title: 'audit title',
          description: 'audit description',
          docsUrl: 'http://www.my-docs.dev',
        },
      ],
      runner: runnerConfig([auditReport()], `${outputDir}/out.json`),
      groups: [],
      slug: 'command-object-plugin',
      title: 'command-object plugin',
      icon: 'javascript',
    },
  ],
  categories: [],
} satisfies CoreConfig;
