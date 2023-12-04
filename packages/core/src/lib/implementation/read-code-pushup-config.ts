import { CoreConfig, coreConfigSchema } from '@code-pushup/models';
import { fileExists, importEsmModule } from '@code-pushup/utils';

export class ConfigPathError extends Error {
  constructor(configPath: string) {
    super(`Provided path '${configPath}' is not valid.`);
  }
}

export async function readCodePushupConfig(filepath: string) {
  if (!filepath.length) {
    throw new Error('The configuration path is empty.');
  }

  if (!(await fileExists(filepath))) {
    throw new ConfigPathError(filepath);
  }

  return importEsmModule<CoreConfig>(
    {
      filepath,
    },
    coreConfigSchema.parse,
  );
}
