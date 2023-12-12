import {
  CONFIG_FILE_NAME,
  CoreConfig,
  coreConfigSchema,
} from '@code-pushup/models';
import { fileExists, importEsmModule } from '@code-pushup/utils';

export class ConfigPathError extends Error {
  constructor(configPath: string) {
    super(`Provided path '${configPath}' is not valid.`);
  }
}

export async function readRcByPath(filepath: string): Promise<CoreConfig> {
  if (!filepath.length) {
    throw new Error('The path to the configuration file is empty.');
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

export async function readRc(): Promise<CoreConfig> {
  let ext = '';
  // eslint-disable-next-line functional/no-loop-statements
  for (const extension of ['ts', 'mjs', 'js']) {
    const path = `${CONFIG_FILE_NAME}.${extension}`;
    const exists = await fileExists(path).catch(() => false);

    if (exists) {
      ext = extension;
      break;
    }
  }

  return readRcByPath(
    ext ? `${CONFIG_FILE_NAME}.${ext}` : `${CONFIG_FILE_NAME}.ts`,
  );
}
