import type { ProjectConfiguration } from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/**
 * Project Config is created by reading files and combining the results
 *
 * @param matchingFilePath
 *
 * @catch error when the file is not present
 *
 * @returns Combined PackageNxConfig and ProjectConfiguration fields, and unified targets
 */

// Project lib-a-e2e is an environment project but has no implicit dependencies.
export async function getProjectConfig(matchingFilePath: string) {
  const dirName = dirname(matchingFilePath);

  const projectJson: ProjectConfiguration = await readFile(
    join(dirName, 'project.json'),
    'utf8',
  )
    .catch(() => '{}')
    .then(JSON.parse);
  const { nx: pkgProjectJson }: { nx: ProjectConfiguration } = await readFile(
    join(dirName, 'package.json'),
    'utf8',
  )
    .catch(() => '{}')
    .then(JSON.parse);

  return {
    ...projectJson,
    ...pkgProjectJson,
    targets: {
      ...projectJson.targets,
      ...pkgProjectJson?.targets,
    },
  } satisfies ProjectConfiguration;
}
