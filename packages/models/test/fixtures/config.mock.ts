import { CoreConfig } from '../../src';
import { categoryConfigs } from './categories.mock';
import { eslintPluginConfig } from './eslint-plugin.mock';
import { lighthousePluginConfig } from './lighthouse-plugin.mock';
import { auditReport, pluginConfig } from './plugin-config.mock';

export function config(outputDir = 'tmp'): CoreConfig {
  return {
    persist: { outputDir },
    upload: {
      organization: 'code-pushup',
      project: 'cli',
      apiKey: 'dummy-api-key',
      server: 'https://example.com/api',
    },
    categories: categoryConfigs(),
    plugins: [eslintPluginConfig(outputDir), lighthousePluginConfig(outputDir)],
  };
}

export function minimalConfig(
  outputDir = 'tmp',
): Omit<CoreConfig, 'upload'> & Required<Pick<CoreConfig, 'upload'>> {
  const PLUGIN_1_SLUG = 'plugin-1';
  const AUDIT_1_SLUG = 'audit-1';
  return JSON.parse(
    JSON.stringify({
      persist: { outputDir },
      upload: {
        organization: 'code-pushup',
        project: 'cli',
        apiKey: 'dummy-api-key',
        server: 'https://example.com/api',
      },
      categories: [
        {
          slug: 'category-1',
          title: 'Category 1',
          refs: [
            {
              type: 'audit',
              plugin: PLUGIN_1_SLUG,
              slug: AUDIT_1_SLUG,
              weight: 1,
            },
          ],
        },
      ],
      plugins: [
        pluginConfig([auditReport({ slug: AUDIT_1_SLUG })], {
          slug: PLUGIN_1_SLUG,
          outputDir,
        }),
      ],
    } satisfies Omit<CoreConfig, 'upload'> & Required<Pick<CoreConfig, 'upload'>>),
  );
}
