import { stat } from 'fs/promises';
import { CoreConfig, coreConfigSchema } from '@code-pushup/models';
import { importEsmModule } from '@code-pushup/utils';

export class ConfigPathError extends Error {
  constructor(configPath: string) {
    super(`Config path ${configPath} is not a file.`);
  }
}

export async function readCodePushupConfig(filepath: string) {
  if (!filepath.length) {
    throw new Error('No filepath provided');
  }

  const isFile = (await stat(filepath)).isFile();
  if (!isFile) {
    throw new ConfigPathError(filepath);
  }

  return importEsmModule<CoreConfig>(
    {
      filepath: filepath,
    },
    coreConfigSchema.parse,
  );
}
