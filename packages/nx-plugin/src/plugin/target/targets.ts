import { readdir } from 'node:fs/promises';
import { CP_TARGET_NAME } from '../constants';
import type { NormalizedCreateNodesContext } from '../types';
import { createConfigurationTarget } from './configuration-target';
import { CODE_PUSHUP_CONFIG_REGEX } from './constants';
import { createExecutorTarget } from './executor-target';

export async function createTargets(
  normalizedContext: NormalizedCreateNodesContext,
) {
  const {
    targetName = CP_TARGET_NAME,
    bin,
    projectPrefix,
  } = normalizedContext.createOptions;
  const rootFiles = await readdir(normalizedContext.projectRoot);
  return rootFiles.some(filename => filename.match(CODE_PUSHUP_CONFIG_REGEX))
    ? {
        [targetName]: createExecutorTarget({ bin, projectPrefix }),
      }
    : // if NO code-pushup.config.*.(ts|js|mjs) is present return configuration target
      {
        [`${targetName}--configuration`]: createConfigurationTarget({
          targetName,
          projectName: normalizedContext.projectJson.name,
          bin,
        }),
      };
}
