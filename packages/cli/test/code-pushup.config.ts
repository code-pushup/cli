import { join } from 'path';
import { CoreConfig } from '@code-pushup/models';
import {echoRunnerConfig} from "@code-pushup/models/testing";

/**
 * This config is most probably a left over as it has no dedicated use case described
 *
 * Usage:
 * npx ./dist/packages/cli collect --config=./packages/cli/test/code-pushup.config.ts
 */

const outputDir = 'tmp';
const outputFile1 = join(outputDir, `plugin-1-output.${Date.now()}.json`);
const outputFile2 = join(outputDir, `plugin-2-output.${Date.now()}.json`);

const auditsP1 = [
  {
    slug: 'plugin-1-audit-1',
    title: 'Audit 1',
    description: 'A dummy audit to fill the void 1',
    docsUrl: 'http://www.my-docs.dev?slug=dummy-audit-1',
  },
  {
    slug: 'plugin-1-audit-2',
    title: 'Dummy Audit 2',
    description: 'A dummy audit to fill the void 2',
    docsUrl: 'http://www.my-docs.dev?slug=dummy-audit-2',
  },
  {
    slug: 'plugin-1-audit-3',
    title: 'Dummy Audit 3',
    description: 'A dummy audit to fill the void 3',
    docsUrl: 'http://www.my-docs.dev?slug=dummy-audit-3',
  },
];

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
      slug: 'plugin-1',
      title: 'Dummy Plugin',
      icon: 'javascript',
      docsUrl: 'http://www.my-docs.dev?slug=dummy-plugin',
      audits: [],
      runner: echoRunnerConfig(auditsP1.map(a => ({
        ...a,
        value: 0,
        score: 0,
        displayValue: '0x'
      })), outputFile1),
    },
    /*{
      slug: 'plugin-2',
      title: 'Dummy Plugin that takes time 2',
      icon: 'javascript',
      docsUrl: 'http://www.my-docs.dev?slug=dummy-plugin',
      audits: [
        {
          slug: 'plugin-2-audit-1',
          title: 'Dummy Audit 1',
        },
      ],
      runner: {
        command: 'echo',
        args: [
          `${JSON.stringify([
            {
              title: 'Dummy Audit 1',
              slug: 'plugin-2-audit-1',
              value: 420,
              score: 0.42,
            },
          ])} > ${outputFile2}`,
        ],
        outputFile: outputFile2,
      },
    },*/
  ],
  categories: [
    {
      slug: 'category-1',
      title: 'Category 1',
      description: 'A dummy audit to fill the void',
      refs: [
        {
          plugin: 'plugin-1',
          type: 'audit',
          slug: 'plugin-1-audit-1',
          weight: 1,
        }
      ],
    },
    /*{
      slug: 'category-2',
      title: 'Category 2',
      description: 'A dummy audit to fill the void 2',
      refs: [
        {
          plugin: 'plugin-1',
          type: 'audit',
          slug: 'plugin-1-audit-3',
          weight: 3,
        },
      ],
    },*/
  ],
} satisfies CoreConfig;
