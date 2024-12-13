import { bold } from 'ansis';
import path from 'node:path';
import { fromError, isZodErrorLike } from 'zod-validation-error';
import {
  CONFIG_FILE_NAME,
  type CoreConfig,
  SUPPORTED_CONFIG_FILE_FORMATS,
  coreConfigSchema,
} from '@code-pushup/models';
import {
  fileExists,
  importModule,
  zodErrorMessageBuilder,
} from '@code-pushup/utils';

export class ConfigPathError extends Error {
  constructor(configPath: string) {
    super(`Provided path '${configPath}' is not valid.`);
  }
}

export class ConfigValidationError extends Error {
  constructor(configPath: string, message: string) {
    const relativePath = path.relative(process.cwd(), configPath);
    super(`Failed parsing core config in ${bold(relativePath)}.\n\n${message}`);
  }
}

export async function readRcByPath(
  filepath: string,
  tsconfig?: string,
): Promise<CoreConfig> {
  if (filepath.length === 0) {
    throw new Error('The path to the configuration file is empty.');
  }

  if (!(await fileExists(filepath))) {
    throw new ConfigPathError(filepath);
  }

  const cfg = await importModule({ filepath, tsconfig, format: 'esm' });

  try {
    return coreConfigSchema.parse(cfg);
  } catch (error) {
    const validationError = fromError(error, {
      messageBuilder: zodErrorMessageBuilder,
    });
    throw isZodErrorLike(error)
      ? new ConfigValidationError(filepath, validationError.message)
      : error;
  }
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
