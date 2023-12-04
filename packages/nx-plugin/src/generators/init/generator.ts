import {
  NxJsonConfiguration,
  Tree,
  addDependenciesToPackageJson,
  convertNxGenerator,
  readJson,
  readNxJson,
  runTasksInSerial,
  updateJson,
  updateNxJson,
} from '@nx/devkit';
import {
  cpuCliVersion,
  cpuModelVersion,
  cpuNxPluginVersion,
  cpuUtilsVersion,
} from '../../utils/versions';
import { InitGeneratorSchema } from './schema';

function checkDependenciesInstalled(host: Tree) {
  const packageJson = readJson(host, 'package.json');
  const devDependencies: Record<string, string> = {};
  const dependencies = {};
  packageJson.dependencies = packageJson.dependencies || {};
  packageJson.devDependencies = packageJson.devDependencies || {};

  // base deps
  devDependencies['@code-pushup/nx-plugin'] = cpuNxPluginVersion;
  devDependencies['@code-pushup/models'] = cpuModelVersion;
  devDependencies['@code-pushup/utils'] = cpuUtilsVersion;
  devDependencies['@code-pushup/cli'] = cpuCliVersion;

  return addDependenciesToPackageJson(host, dependencies, devDependencies);
}

function moveToDevDependencies(tree: Tree) {
  updateJson(tree, 'package.json', packageJson => {
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.devDependencies = packageJson.devDependencies || {};

    if (packageJson.dependencies['@code-pushup/nx-plugin']) {
      packageJson.devDependencies['@code-pushup/nx-plugin'] =
        packageJson.dependencies['@code-pushup/nx-plugin'];
      delete packageJson.dependencies['@code-pushup/nx-plugin'];
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
    cache: true,
  };

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
