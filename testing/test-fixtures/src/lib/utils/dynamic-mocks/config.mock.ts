import {
  type CoreConfig,
  coreConfigSchema,
  validate,
} from '@code-pushup/models';
import { categoryConfigsMock } from './categories.mock.js';
import { eslintPluginConfigMock } from './eslint-plugin.mock.js';
import { lighthousePluginConfigMock } from './lighthouse-plugin.mock.js';
import { persistConfigMock } from './persist-config.mock.js';
import { auditReportMock, pluginConfigMock } from './plugin-config.mock.js';

export function configMock(outputDir = 'tmp'): CoreConfig {
  return validate(coreConfigSchema, {
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

  const cfg = validate(coreConfigSchema, {
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
