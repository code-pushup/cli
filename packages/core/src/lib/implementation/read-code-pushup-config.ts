import { CoreConfig, coreConfigSchema } from '@code-pushup/models';
import { fileExists, importEsmModule } from '@code-pushup/utils';

export class ConfigPathError extends Error {
  constructor(configPath: string) {
    super(`Provided path '${configPath}' is not valid.`);
  }
}

export async function readCodePushupConfig(
  filepath: string,
): Promise<CoreConfig> {
  if (!(await fileExists(filepath))) {
    throw new ConfigPathError(filepath);
  }

  return coreConfigSchema.parse(await importEsmModule({ filepath }));
}
