import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PackageJson } from 'type-fest';

const workspaceRoot = join(fileURLToPath(dirname(import.meta.url)), '../../');
const projectsFolder = join(
  fileURLToPath(dirname(import.meta.url)),
  '../../../',
);

export const cpuNxPluginVersion = (await loadPackageJson(workspaceRoot))
  .version as string;
export const cpuModelVersion = (
  await loadPackageJson(join(projectsFolder, 'cli'))
).version as string;
export const cpuUtilsVersion = (
  await loadPackageJson(join(projectsFolder, 'utils'))
).version as string;
export const cpuCliVersion = (
  await loadPackageJson(join(projectsFolder, 'models'))
).version as string;

async function loadPackageJson(folderPath: string): Promise<PackageJson> {
  const packageJsonContent = await readFile(join(folderPath, 'package.json'));
  return JSON.parse(packageJsonContent.toString()) as PackageJson;
}
