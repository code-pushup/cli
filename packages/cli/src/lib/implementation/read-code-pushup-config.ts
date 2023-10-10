import {CoreConfig, coreConfigSchema} from '@code-pushup/models';
import {stat} from 'fs/promises';
import {importModule} from '@code-pushup/utils';
import {ConfigPathError} from './config-middleware';

// @TODO [73] move into core
export async function readCodePushupConfig(filepath: string) {
  const isFile = (await stat(filepath)).isFile();

  if (!isFile) {
    throw new ConfigPathError(filepath);
  }

  return importModule<CoreConfig>(
    {
      filepath,
    },
    coreConfigSchema.parse,
  );
}
