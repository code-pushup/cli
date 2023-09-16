import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  logger,
  readJson,
  readNxJson,
  runTasksInSerial,
  Tree,
  updateJson,
  updateNxJson,
} from '@nx/devkit';
import { initGenerator as viteInitGenerator } from '@nx/vite';

import { InitGeneratorSchema } from './schema';
import {NxJsonConfiguration} from "nx/src/config/nx-json";

function checkDependenciesInstalled(host: Tree, schema: InitGeneratorSchema) {
  const packageJson = readJson(host, 'package.json');
  const devDependencies = {};
  const dependencies = {};
  packageJson.dependencies = packageJson.dependencies || {};
  packageJson.devDependencies = packageJson.devDependencies || {};

  return addDependenciesToPackageJson(host, dependencies, devDependencies);
}

function moveToDevDependencies(tree: Tree) {
  updateJson(tree, 'package.json', (packageJson) => {
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.devDependencies = packageJson.devDependencies || {};

    return packageJson;
  });
}

export function createCodePushupConfig(tree: Tree) {
  const nxJson: NxJsonConfiguration = readNxJson(tree) as NxJsonConfiguration;

  nxJson.targetDefaults ??= {};
  nxJson.namedInputs ??= {};

  const productionFileSet = nxJson.namedInputs.production;
  if (productionFileSet) {
    productionFileSet.push(
      '!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)',
      '!{projectRoot}/tsconfig.spec.json'
    );

    nxJson.namedInputs.production = Array.from(new Set(productionFileSet));
  }

  updateNxJson(tree, nxJson);
}

export async function initGenerator(tree: Tree, schema: InitGeneratorSchema) {
  logger.info('code pushup initGenerator');
  moveToDevDependencies(tree);
  createCodePushupConfig(tree);
  const tasks = [];

  tasks.push(
    await viteInitGenerator(tree, {
      ...schema,
      testEnvironment: 'node',
      uiFramework: 'none'
    })
  );

  tasks.push(checkDependenciesInstalled(tree, schema));
  return runTasksInSerial(...tasks);
}

export default initGenerator;
export const initSchematic = convertNxGenerator(initGenerator);
