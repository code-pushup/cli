import { CoreConfig, coreConfigSchema } from '@code-pushup/models';
import { stat } from 'fs/promises';
import { importModule } from '@code-pushup/utils';
import { ConfigParseError } from './config-middleware';

// @TODO [73] move into core
export async function readCodePushupConfig(filepath: string) {
  try {
    const stats = await stat(filepath);
    if (!stats.isFile) {
      throw new ConfigParseError(filepath);
    }
  } catch (err) {
    throw new ConfigParseError(filepath);
  }

  return importModule<CoreConfig>(
    {
      filepath,
    },
    coreConfigSchema.parse,
  );
}
