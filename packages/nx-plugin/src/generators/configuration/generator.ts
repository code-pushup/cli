import {
  Tree,
  formatFiles,
  generateFiles,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nx/devkit';
import { join } from 'node:path';
import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { DEFAULT_TARGET_NAME } from '../../internal/constants';
import { ConfigurationGeneratorOptions } from './schema';

export async function configurationGenerator(
  tree: Tree,
  options: ConfigurationGeneratorOptions,
) {
  const projectConfiguration = readProjectConfiguration(tree, options.project);

  generateCodePushupConfig(tree, projectConfiguration, options);

  addTargetToProject(tree, projectConfiguration, options);

  await formatFiles(tree);
}

export function addTargetToProject(
  tree: Tree,
  projectConfiguration: ProjectConfiguration,
  options: ConfigurationGeneratorOptions,
) {
  const { targets } = projectConfiguration;
  const { targetName, project, skipTarget } = options;

  if (skipTarget) {
    return;
  }

  const codePushupTargetConfig = {
    executor: '@code-pushup/nx-plugin:autorun',
  };

  updateProjectConfiguration(tree, project, {
    ...projectConfiguration,
    targets: {
      ...targets,
      [targetName ?? DEFAULT_TARGET_NAME]: codePushupTargetConfig,
    },
  });
}

export function generateCodePushupConfig(
  tree: Tree,
  projectConfiguration: ProjectConfiguration,
  options: ConfigurationGeneratorOptions,
) {
  const { root } = projectConfiguration;
  const supportedFormats = ['ts', 'mjs', 'js'];
  const firstExistingFormat = supportedFormats.find(ext =>
    tree.exists(join(root, `code-pushup.config.${ext}`)),
  );
  if (firstExistingFormat) {
    console.warn(
      `NOTE: No config file created as code-pushup.config.${firstExistingFormat} file already exists.`,
    );
  } else {
    generateFiles(tree, join(__dirname, 'files'), root, options);
  }
}

export default configurationGenerator;
