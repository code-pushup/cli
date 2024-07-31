import {
  Tree,
  formatFiles,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nx/devkit';
import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { DEFAULT_TARGET_NAME, PACKAGE_NAME } from '../../internal/constants';
import { generateCodePushupConfig } from './code-pushup-config';
import { ConfigurationGeneratorOptions } from './schema';

export async function configurationGenerator(
  tree: Tree,
  options: ConfigurationGeneratorOptions,
) {
  const projectConfiguration = readProjectConfiguration(tree, options.project);

  const { skipConfig, skipTarget } = options;

  if (skipConfig !== true) {
    generateCodePushupConfig(tree, projectConfiguration.root);
  }

  if (skipTarget !== true) {
    addTargetToProject(tree, projectConfiguration, options);
  }

  await formatFiles(tree);
}

export function addTargetToProject(
  tree: Tree,
  projectConfiguration: ProjectConfiguration,
  options: ConfigurationGeneratorOptions,
) {
  const { targets } = projectConfiguration;
  const { targetName, project, bin = PACKAGE_NAME } = options;

  const codePushupTargetConfig = {
    executor: `${bin}:autorun`,
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
