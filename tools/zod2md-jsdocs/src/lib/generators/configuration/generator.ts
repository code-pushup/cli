import {
  type Tree,
  formatFiles,
  logger,
  readProjectConfiguration,
} from '@nx/devkit';
import type { ConfigurationGeneratorOptions } from './schema.js';
import { generateZod2MdConfig } from './zod2md-config.js';

export async function configurationGenerator(
  tree: Tree,
  options: ConfigurationGeneratorOptions,
) {
  const projectConfiguration = readProjectConfiguration(tree, options.project);

  const { skipConfig, skipFormat } = options;

  if (skipConfig === true) {
    logger.info('Skip config file creation');
  } else {
    generateZod2MdConfig(tree, projectConfiguration.root);
  }

  if (skipFormat === true) {
    logger.info('Skip formatting files');
  } else {
    await formatFiles(tree);
  }
}

export default configurationGenerator;
