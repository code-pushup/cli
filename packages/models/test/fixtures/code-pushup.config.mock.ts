import { join } from 'path';
import { CoreConfig } from '../../src';
import { createFileWriteRunnerConfig } from './file-write-runner-config';
import { auditReport } from './plugin-config.mock';

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
      runner: createFileWriteRunnerConfig(
        [auditReport()],
        join(outputDir, 'out.json'),
      ),
      groups: [],
      slug: 'command-object-plugin',
      title: 'command-object plugin',
      icon: 'javascript',
    },
  ],
  categories: [],
} satisfies CoreConfig;
