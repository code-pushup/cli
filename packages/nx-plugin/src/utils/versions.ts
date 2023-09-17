import { readFileSync } from 'fs';
import { join } from 'path';

const workspaceRoot = join(__dirname, '../../');
const projectsFolder = join(__dirname, '../../../');

export const cpuNxPluginVersion = loadPackageJson(workspaceRoot).version;
export const cpuModelVersion = loadPackageJson(
  join(projectsFolder, 'cli'),
).version;
export const cpuUtilsVersion = loadPackageJson(
  join(projectsFolder, 'utils'),
).version;
export const cpuCliVersion = loadPackageJson(
  join(projectsFolder, 'models'),
).version;

function loadPackageJson(folderPath: string) {
  return JSON.parse(readFileSync(join(folderPath, 'package.json')).toString());
}
