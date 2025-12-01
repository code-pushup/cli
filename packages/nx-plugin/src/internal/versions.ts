import { readJsonFile } from '@nx/devkit';
import * as path from 'node:path';
import type { PackageJson } from 'nx/src/utils/package-json';

const workspaceRoot = path.join(__dirname, '../../');
const projectsFolder = path.join(__dirname, '../../../');

export const cpNxPluginVersion = readDependencyVersion(workspaceRoot);
export const cpModelVersion = readDependencyVersion(
  path.join(projectsFolder, 'cli'),
);
export const cpUtilsVersion = readDependencyVersion(
  path.join(projectsFolder, 'utils'),
);
export const cpCliVersion = readDependencyVersion(
  path.join(projectsFolder, 'models'),
);

/**
 * Load the package.json file from the given folder path and returns the package version.
 * If the version is not given of the package.json file does not exist it returns the fallback value.
 */
function readDependencyVersion(
  folderPath: string,
  fallbackVersion = 'latest',
): string {
  try {
    return (
      readJsonFile<PackageJson>(path.join(folderPath, 'package.json'))
        .version ?? fallbackVersion
    );
  } catch {
    return fallbackVersion;
  }
}
