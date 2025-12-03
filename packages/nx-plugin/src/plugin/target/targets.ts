import { readdir } from 'node:fs/promises';
import { CP_TARGET_NAME } from '../constants.js';
import type {
  CreateNodesOptions,
  ProjectConfigurationWithName,
} from '../types.js';
import { createConfigurationTarget } from './configuration-target.js';
import { CODE_PUSHUP_CONFIG_REGEX } from './constants.js';
import { createExecutorTarget } from './executor-target.js';

export type CreateTargetsOptions = {
  projectJson: ProjectConfigurationWithName;
  projectRoot: string;
  createOptions: CreateNodesOptions;
};

export async function createTargets(normalizedContext: CreateTargetsOptions) {
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
        [`${targetName}--configuration`]: await createConfigurationTarget({
          projectName: normalizedContext.projectJson.name,
        }),
      };
}
