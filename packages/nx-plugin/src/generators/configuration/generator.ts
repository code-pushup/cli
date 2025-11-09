import {
  type Tree,
  formatFiles,
  logger,
  readProjectConfiguration,
} from '@nx/devkit';
import { generateCodePushupConfig } from './code-pushup-config.js';
import type { ConfigurationGeneratorOptions } from './schema.js';

export async function configurationGenerator(
  tree: Tree,
  options: ConfigurationGeneratorOptions,
) {
  const projectConfiguration = readProjectConfiguration(tree, options.project);

  const { skipConfig, skipFormat } = options;

  if (skipConfig === true) {
    logger.info('Skip config file creation');
  } else {
    generateCodePushupConfig(tree, projectConfiguration.root);
  }

  if (skipFormat === true) {
    logger.info('Skip formatting files');
  } else {
    await formatFiles(tree);
  }
}

export default configurationGenerator;
