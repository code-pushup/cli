import { readdir } from 'node:fs/promises';
import { CP_TARGET_NAME } from '../constants';
import type {
  CreateNodesOptions,
  NormalizedCreateNodesContext,
} from '../types';
import { codePushupTarget } from './code-pushup-target';
import { createConfigurationTarget } from './configuration-target';

export async function createTargets(
  normalizedContext: NormalizedCreateNodesContext,
  parsedCreateNodesOptions?: CreateNodesOptions,
) {
  const { targetName = CP_TARGET_NAME } = normalizedContext.createOptions;
  const rootFiles = await readdir(normalizedContext.projectRoot);
  return rootFiles.some(filename =>
    filename.match(/^code-pushup\.config.(\w*\.)*(ts|js|mjs)$/),
  )
    ? { [`${targetName}--autorun`]: codePushupTarget(parsedCreateNodesOptions) }
    : {
        [`${targetName}--configuration`]: createConfigurationTarget(
          normalizedContext.projectJson.name,
        ),
      };
}
