import { readJsonFile } from '@nx/devkit';
import { join } from 'node:path';
import type { PackageJson } from 'nx/src/utils/package-json';

const workspaceRoot = join(__dirname, '../../');
const projectsFolder = join(__dirname, '../../../');

export const cpNxPluginVersion = loadPackageJson(workspaceRoot).version;
export const cpModelVersion = loadPackageJson(
  join(projectsFolder, 'cli'),
).version;
export const cpUtilsVersion = loadPackageJson(
  join(projectsFolder, 'utils'),
).version;
export const cpCliVersion = loadPackageJson(
  join(projectsFolder, 'models'),
).version;

function loadPackageJson(folderPath: string): PackageJson {
  return readJsonFile<PackageJson>(join(folderPath, 'package.json'));
}
