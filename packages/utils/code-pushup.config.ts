import 'dotenv/config';
import {
  configureCoveragePlugin,
  configureEslintPlugin,
  configureJsDocsPlugin,
  configureTypescriptPlugin,
  configureUpload,
} from '../../code-pushup.preset.js';
import { mergeConfigs, profiler } from '../utils/src/index.js';

const projectName = 'utils';

export default profiler.measureAsync(
  'cli:setup-core-config',
  async () =>
    mergeConfigs(
      configureUpload(projectName),
      await configureEslintPlugin(projectName),
      // await configureCoveragePlugin(projectName),
      configureTypescriptPlugin(projectName),
      configureJsDocsPlugin(projectName),
    ),
  {
    color: 'primary-light',
    success: (config: CoreConfig) => ({
      properties: [
        ['Project', projectName],
        ['Plugins', String(config.plugins?.length || 0)],
        ['Categories', String(config.categories?.length || 0)],
      ],
      tooltipText: `Configured core config for ${projectName} with ${config.plugins?.length || 0} plugins`,
    }),
  },
);
