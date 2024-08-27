import { type CoreConfig, coreConfigSchema } from '@code-pushup/models';
import { categoryConfigsMock } from './categories.mock';
import { eslintPluginConfigMock } from './eslint-plugin.mock';
import { lighthousePluginConfigMock } from './lighthouse-plugin.mock';
import { persistConfigMock } from './persist-config.mock';
import { auditReportMock, pluginConfigMock } from './plugin-config.mock';

export function configMock(outputDir = 'tmp'): CoreConfig {
  return coreConfigSchema.parse({
    persist: persistConfigMock({ outputDir }),
    upload: {
      organization: 'code-pushup',
      project: 'cli',
      apiKey: 'dummy-api-key',
      server: 'https://example.com/api',
    },
    categories: categoryConfigsMock(),
    plugins: [
      eslintPluginConfigMock(outputDir),
      lighthousePluginConfigMock(outputDir),
    ],
  });
}

export function minimalConfigMock(
  outputDir = 'tmp',
): Omit<CoreConfig, 'upload'> & Required<Pick<CoreConfig, 'upload'>> {
  const PLUGIN_1_SLUG = 'plugin-1';
  const AUDIT_1_SLUG = 'audit-1';
  const outputFile = `${PLUGIN_1_SLUG}.${Date.now()}.json`;

  const cfg = coreConfigSchema.parse({
    persist: persistConfigMock({ outputDir }),
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
      pluginConfigMock([auditReportMock({ slug: AUDIT_1_SLUG })], {
        slug: PLUGIN_1_SLUG,
        outputDir,
        outputFile,
      }),
    ],
  });

  return JSON.parse(JSON.stringify(cfg));
}
