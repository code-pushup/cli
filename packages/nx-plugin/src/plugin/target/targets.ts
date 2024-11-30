import type { ProjectConfiguration } from '@nx/devkit';
import { readdir } from 'node:fs/promises';
import { CP_TARGET_NAME } from '../constants';
import type { NormalizedCreateNodesOptions } from '../types';
import { createConfigurationTarget } from './configuration-target';
import { CODE_PUSHUP_CONFIG_REGEX } from './constants';
import { createExecutorTarget } from './executor-target';

export async function createTargets(
  projectConfig: ProjectConfiguration,
  options: NormalizedCreateNodesOptions,
) {
  const { targetName = CP_TARGET_NAME, bin, projectPrefix } = options;
  const rootFiles = await readdir(projectConfig.root);
  return rootFiles.some(filename => filename.match(CODE_PUSHUP_CONFIG_REGEX))
    ? {
        [targetName]: createExecutorTarget({ bin, projectPrefix }),
      }
    : // if NO code-pushup.config.*.(ts|js|mjs) is present return configuration target
      {
        [`${targetName}--configuration`]: createConfigurationTarget({
          targetName,
          projectName: projectConfig.name,
          bin,
        }),
      };
}
