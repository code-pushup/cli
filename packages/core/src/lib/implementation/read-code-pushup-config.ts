import { stat } from 'fs/promises';
import {
  CoreConfig,
  coreConfigSchema,
  filePathSchema,
} from '@code-pushup/models';
import { importEsmModule } from '@code-pushup/utils';

export class ConfigPathError extends Error {
  constructor(configPath: string) {
    super(`Config path ${configPath} is not a file.`);
  }
}

export async function readCodePushupConfig(filepath: string) {
  const validFilepath = filePathSchema('config file path').parse(filepath);
  const isFile = (await stat(validFilepath)).isFile();

  if (!isFile) {
    throw new ConfigPathError(validFilepath);
  }

  return importEsmModule<CoreConfig>(
    {
      filepath: validFilepath,
    },
    coreConfigSchema.parse,
  );
}
