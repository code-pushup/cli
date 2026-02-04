import {
  type Tree,
  formatFiles,
  logger,
  readProjectConfiguration,
} from '@nx/devkit';
import type { ConfigurationGeneratorOptions } from './schema';
import { generateTsConfig } from './tsconfig-config';

export async function configurationGenerator(
  tree: Tree,
  options: ConfigurationGeneratorOptions,
) {
  const projectConfiguration = readProjectConfiguration(tree, options.project);
  const { targetName, skipConfig, skipFormat } = options;

  if (skipConfig === true) {
    logger.info('Skip config file creation');
  } else {
    generateTsConfig(tree, projectConfiguration.root, {
      targetName,
    });
  }

  if (skipFormat === true) {
    logger.info('Skip formatting files');
  } else {
    await formatFiles(tree);
  }
}
export default configurationGenerator;
