import { readdir } from 'node:fs/promises';
import { CP_TARGET_NAME } from '../constants';
import type { NormalizedCreateNodesContext } from '../types';
import { createConfigurationTarget } from './configuration-target';

export async function createTargets(
  normalizedContext: NormalizedCreateNodesContext,
) {
  const { targetName = CP_TARGET_NAME, bin } = normalizedContext.createOptions;
  const rootFiles = await readdir(normalizedContext.projectRoot);
  return rootFiles.some(filename =>
    filename.match(/^code-pushup\.config.(\w*\.)*(ts|js|mjs)$/),
  )
    ? // @TODO return code-pushup cli target https://github.com/code-pushup/cli/issues/619
      {}
    : // if NO code-pushup.config.*.(ts|js|mjs) is present return configuration target
      {
        [`${targetName}--configuration`]: createConfigurationTarget({
          projectName: normalizedContext.projectJson.name,
          bin,
        }),
      };
}
