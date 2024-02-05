import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = join(fileURLToPath(dirname(import.meta.url)), '../../');
const projectsFolder = join(
  fileURLToPath(dirname(import.meta.url)),
  '../../../',
);
type PkgJson = { version: string };
export const cpuNxPluginVersion = (await loadPackageJson(workspaceRoot))
  .version;
export const cpuModelVersion = (
  await loadPackageJson(join(projectsFolder, 'cli'))
).version;
export const cpuUtilsVersion = (
  await loadPackageJson(join(projectsFolder, 'utils'))
).version;
export const cpuCliVersion = (
  await loadPackageJson(join(projectsFolder, 'models'))
).version;

async function loadPackageJson(folderPath: string): Promise<PkgJson> {
  const packageJsonContent = await readFile(join(folderPath, 'package.json'));
  return JSON.parse(packageJsonContent.toString()) as PkgJson;
}
