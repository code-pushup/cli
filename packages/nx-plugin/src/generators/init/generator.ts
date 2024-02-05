/* eslint-disable functional/immutable-data */
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

const nxPluginPackageName = '@code-pushup/nx-plugin';
type PkgJson = Record<string, Record<string, string>>;
function checkDependenciesInstalled(host: Tree) {
  const packageJson = readJson<PkgJson>(host, 'package.json');
  const devDependencies: Record<string, string> = {};
  const dependencies = {};
  packageJson.dependencies = packageJson.dependencies ?? {};
  packageJson.devDependencies = packageJson.devDependencies ?? {};

  // base deps
  devDependencies[nxPluginPackageName] = cpuNxPluginVersion;
  devDependencies['@code-pushup/models'] = cpuModelVersion;
  devDependencies['@code-pushup/utils'] = cpuUtilsVersion;
  devDependencies['@code-pushup/cli'] = cpuCliVersion;

  return addDependenciesToPackageJson(host, dependencies, devDependencies);
}

function moveToDevDependencies(tree: Tree) {
  updateJson(tree, 'package.json', (packageJson: PkgJson) => {
    const newPackageJson: PkgJson = {
      dependencies: {},
      devDependencies: {},
      ...packageJson,
    };

    if (newPackageJson.dependencies?.[nxPluginPackageName] !== undefined) {
      const { [nxPluginPackageName]: version, ...dependencies } =
        newPackageJson.dependencies as { [nxPluginPackageName]: string };
      return {
        ...newPackageJson,
        dependencies,
        devDependencies: {
          ...newPackageJson.devDependencies,
          [nxPluginPackageName as string]: version,
        },
      };
    }
    return newPackageJson;
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

export function initGenerator(tree: Tree, schema: InitGeneratorSchema) {
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
