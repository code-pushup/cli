import { CoreConfig } from '../../src';
import { categoryConfigs } from './categories.mock';
import { eslintPluginConfig } from './eslint-plugin.mock';
import { lighthousePluginConfig } from './lighthouse-plugin.mock';

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

export default config();
