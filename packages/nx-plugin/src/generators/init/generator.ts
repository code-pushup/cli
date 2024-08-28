/* eslint-disable functional/immutable-data */
import {
  type NxJsonConfiguration,
  type Tree,
  addDependenciesToPackageJson,
  convertNxGenerator,
  logger,
  readJson,
  readNxJson,
  runTasksInSerial,
  updateJson,
  updateNxJson,
} from '@nx/devkit';
import type { PackageJson } from 'nx/src/utils/package-json';
import { PACKAGE_NAME } from '../../internal/constants';
import {
  cpCliVersion,
  cpModelVersion,
  cpNxPluginVersion,
  cpUtilsVersion,
} from '../../internal/versions';
import type { InitGeneratorSchema } from './schema';

function checkDependenciesInstalled(host: Tree) {
  const packageJson = readJson<PackageJson>(host, 'package.json');
  const devDependencies: Record<string, string> = {};
  const dependencies = {};
  packageJson.dependencies = packageJson.dependencies ?? {};
  packageJson.devDependencies = packageJson.devDependencies ?? {};

  // base deps
  devDependencies[PACKAGE_NAME] = cpNxPluginVersion;
  devDependencies['@code-pushup/models'] = cpModelVersion;
  devDependencies['@code-pushup/utils'] = cpUtilsVersion;
  devDependencies['@code-pushup/cli'] = cpCliVersion;

  return addDependenciesToPackageJson(host, dependencies, devDependencies);
}

function moveToDevDependencies(tree: Tree) {
  updateJson(tree, 'package.json', (packageJson: PackageJson) => {
    const newPackageJson: PackageJson = {
      dependencies: {},
      devDependencies: {},
      ...packageJson,
    };

    if (newPackageJson.dependencies?.[PACKAGE_NAME] !== undefined) {
      const { [PACKAGE_NAME]: version, ...dependencies } =
        newPackageJson.dependencies;
      return {
        ...newPackageJson,
        dependencies,
        devDependencies: {
          ...newPackageJson.devDependencies,
          [PACKAGE_NAME]: version,
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
  if (schema.skipNxJson) {
    logger.info(`Skip updating nx.json`);
  } else {
    updateNxJsonConfig(tree);
  }

  const tasks = [];
  if (schema.skipPackageJson) {
    logger.info(`Skip updating package.json`);
  } else {
    moveToDevDependencies(tree);
    const installDependencies = checkDependenciesInstalled(tree);
    if (schema.skipInstall) {
      logger.info(`Skip installing packages`);
    } else {
      tasks.push(installDependencies);
    }
  }
  return runTasksInSerial(...tasks);
}

export default initGenerator;
export const initSchematic = convertNxGenerator(initGenerator);
