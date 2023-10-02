import { CoreConfig, coreConfigSchema } from '@quality-metrics/models';
import { stat } from 'fs/promises';
import { importModule } from './load-file';
import { ConfigParseError } from './config-middleware';

// @TODO move into core
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
