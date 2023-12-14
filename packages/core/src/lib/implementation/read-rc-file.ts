import { join } from 'path';
import {
  CONFIG_FILE_NAME,
  CoreConfig,
  SUPPORTED_CONFIG_FILE_FORMATS,
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
  for (const extension of SUPPORTED_CONFIG_FILE_FORMATS) {
    const path = `${CONFIG_FILE_NAME}.${extension}`;
    const exists = await fileExists(path);

    if (exists) {
      ext = extension;
      break;
    }
  }

  if (!ext) {
    throw new Error(
      `No file ${CONFIG_FILE_NAME}.(${SUPPORTED_CONFIG_FILE_FORMATS.join(
        '|',
      )}) present in ${process.cwd()}`,
    );
  }

  return readRcByPath(
    join(
      process.cwd(),
      `${CONFIG_FILE_NAME}.${ext}`,
    ),
  );
}
