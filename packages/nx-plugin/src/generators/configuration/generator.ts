import {
  type Tree,
  formatFiles,
  logger,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nx/devkit';
import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { DEFAULT_TARGET_NAME, PACKAGE_NAME } from '../../internal/constants';
import { generateCodePushupConfig } from './code-pushup-config';
import type { ConfigurationGeneratorOptions } from './schema';

export async function configurationGenerator(
  tree: Tree,
  options: ConfigurationGeneratorOptions,
) {
  const projectConfiguration = readProjectConfiguration(tree, options.project);

  const { skipConfig, skipTarget, skipFormat } = options;

  if (skipConfig === true) {
    logger.info('Skip config file creation');
  } else {
    generateCodePushupConfig(tree, projectConfiguration.root);
  }

  if (skipTarget === true) {
    logger.info('Skip adding target to project');
  } else {
    addTargetToProject(tree, projectConfiguration, options);
  }

  if (skipFormat === true) {
    logger.info('Skip formatting files');
  } else {
    await formatFiles(tree);
  }
}

export function addTargetToProject(
  tree: Tree,
  projectConfiguration: ProjectConfiguration,
  options: ConfigurationGeneratorOptions,
) {
  const { targets } = projectConfiguration;
  const { targetName, project } = options;

  const codePushupTargetConfig = {
    executor: `${PACKAGE_NAME}:cli`,
  };

  updateProjectConfiguration(tree, project, {
    ...projectConfiguration,
    targets: {
      ...targets,
      [targetName ?? DEFAULT_TARGET_NAME]: codePushupTargetConfig,
    },
  });
}

export default configurationGenerator;
