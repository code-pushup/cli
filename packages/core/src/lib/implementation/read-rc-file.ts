import path from 'node:path';
import {
  CONFIG_FILE_NAME,
  type CoreConfig,
  SUPPORTED_CONFIG_FILE_FORMATS,
  coreConfigSchema,
  validate,
} from '@code-pushup/models';
import { fileExists, importModule } from '@code-pushup/utils';

export class ConfigPathError extends Error {
  constructor(configPath: string) {
    super(`Provided path '${configPath}' is not valid.`);
  }
}

export async function readRcByPath(
  filePath: string,
  tsconfig?: string,
): Promise<CoreConfig> {
  if (filePath.length === 0) {
    throw new Error('The path to the configuration file is empty.');
  }

  if (!(await fileExists(filePath))) {
    throw new ConfigPathError(filePath);
  }

  const cfg: CoreConfig = await importModule({
    filepath: filePath,
    tsconfig,
    format: 'esm',
  });

  return validate(coreConfigSchema, cfg, { filePath });
}

export async function autoloadRc(tsconfig?: string): Promise<CoreConfig> {
  // eslint-disable-next-line functional/no-let
  let ext = '';
  // eslint-disable-next-line functional/no-loop-statements
  for (const extension of SUPPORTED_CONFIG_FILE_FORMATS) {
    const filePath = `${CONFIG_FILE_NAME}.${extension}`;
    const exists = await fileExists(filePath);

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
    path.join(process.cwd(), `${CONFIG_FILE_NAME}.${ext}`),
    tsconfig,
  );
}
