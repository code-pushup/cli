import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  readJson,
  readNxJson,
  runTasksInSerial,
  Tree,
  updateJson,
  updateNxJson,
  NxJsonConfiguration,
} from '@nx/devkit';

import { InitGeneratorSchema } from './schema';

import {
  cpuCliVersion,
  cpuModelVersion,
  cpuUtilsVersion,
  cpuNxPluginVersion,
} from '../../utils/versions';

function checkDependenciesInstalled(host: Tree) {
  const packageJson = readJson(host, 'package.json');
  const devDependencies: Record<string, string> = {};
  const dependencies = {};
  packageJson.dependencies = packageJson.dependencies || {};
  packageJson.devDependencies = packageJson.devDependencies || {};

  // base deps
  devDependencies['@quality-metrics/nx-plugin'] = cpuNxPluginVersion;
  devDependencies['@quality-metrics/models'] = cpuModelVersion;
  devDependencies['@quality-metrics/utils'] = cpuUtilsVersion;
  devDependencies['@quality-metrics/cli'] = cpuCliVersion;

  return addDependenciesToPackageJson(host, dependencies, devDependencies);
}

function moveToDevDependencies(tree: Tree) {
  updateJson(tree, 'package.json', packageJson => {
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.devDependencies = packageJson.devDependencies || {};

    if (packageJson.dependencies['@quality-metrics/nx-plugin']) {
      packageJson.devDependencies['@quality-metrics/nx-plugin'] =
        packageJson.dependencies['@quality-metrics/nx-plugin'];
      delete packageJson.dependencies['@quality-metrics/nx-plugin'];
    }

    return packageJson;
  });
}

function updateNxJsonConfig(tree: Tree) {
  const nxJson: NxJsonConfiguration = readNxJson(tree) as NxJsonConfiguration;

  const targetName = 'code-pushup';

  nxJson.targetDefaults ??= {};
  nxJson.targetDefaults[targetName] = {
    inputs: ['default', '^production'],
  };

  const cacheableOperations =
    nxJson?.tasksRunnerOptions?.default?.options?.cacheableOperations;
  if (cacheableOperations) {
    cacheableOperations.push(targetName);
  }

  updateNxJson(tree, nxJson);
}

export async function initGenerator(tree: Tree, schema: InitGeneratorSchema) {
  if (!schema.skipPackageJson) {
    moveToDevDependencies(tree);
  }
  updateNxJsonConfig(tree);

  const tasks = [];
  if (!schema.skipPackageJson) {
    tasks.push(checkDependenciesInstalled(tree));
  }
  return runTasksInSerial(...tasks);
}

export default initGenerator;
export const initSchematic = convertNxGenerator(initGenerator);
