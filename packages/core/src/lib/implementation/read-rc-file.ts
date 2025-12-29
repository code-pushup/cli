import ansis from 'ansis';
import path from 'node:path';
import {
  CONFIG_FILE_NAME,
  type CoreConfig,
  SUPPORTED_CONFIG_FILE_FORMATS,
  coreConfigSchema,
  validate,
} from '@code-pushup/models';
import { fileExists, importModule, logger, profiler } from '@code-pushup/utils';

export async function readRcByPath(
  filePath: string,
  tsconfig?: string,
): Promise<CoreConfig> {
  return profiler.spanAsync(
    'loadConfigFile',
    async () => {
      const relativePath = path.relative(process.cwd(), filePath);
      const fileExtension = path.extname(filePath) || 'none';

      const formattedTarget = [
        `${ansis.bold(path.relative(process.cwd(), filePath))}`,
        tsconfig &&
          `(paths from ${ansis.bold(path.relative(process.cwd(), tsconfig))})`,
      ]
        .filter(Boolean)
        .join(' ');

      const value = await logger.task(
        `Importing config from ${formattedTarget}`,
        async () => {
          const result = await importModule({
            filepath: filePath,
            tsconfig,
            format: 'esm',
          });
          return { result, message: `Imported config from ${formattedTarget}` };
        },
      );

      const config = validate(coreConfigSchema, value, { filePath });
      logger.info('Configuration is valid ✓');

      const configJson = JSON.stringify(config);
      const configSize = configJson.length;
      const configPreview =
        configSize > 500 ? `${configJson.slice(0, 500)}...` : configJson;

      return config;
    },
    { detail: profiler.spans.cli() },
  );
}

export async function autoloadRc(tsconfig?: string): Promise<CoreConfig> {
  return profiler.spanAsync(
    'loadConfigFile',
    async () => {
      const configFilePatterns = [
        CONFIG_FILE_NAME,
        `{${SUPPORTED_CONFIG_FILE_FORMATS.join(',')}}`,
      ].join('.');

      logger.debug(`Looking for default config file ${configFilePatterns}`);

      // eslint-disable-next-line functional/no-let
      let ext = '';
      const checkedExtensions: string[] = [];

      // eslint-disable-next-line functional/no-loop-statements
      for (const extension of SUPPORTED_CONFIG_FILE_FORMATS) {
        const filePath = `${CONFIG_FILE_NAME}.${extension}`;
        const exists = await fileExists(filePath);
        checkedExtensions.push(extension);

        if (exists) {
          logger.debug(`Found default config file ${ansis.bold(filePath)}`);
          ext = extension;
          break;
        }
      }

      if (!ext) {
        throw new Error(
          `No ${configFilePatterns} file present in ${process.cwd()}`,
        );
      }

      const discoveredFilePath = path.join(
        process.cwd(),
        `${CONFIG_FILE_NAME}.${ext}`,
      );
      const relativePath = path.relative(process.cwd(), discoveredFilePath);

      const formattedTarget = [
        `${ansis.bold(relativePath)}`,
        tsconfig &&
          `(paths from ${ansis.bold(path.relative(process.cwd(), tsconfig))})`,
      ]
        .filter(Boolean)
        .join(' ');

      const value = await logger.task(
        `Importing config from ${formattedTarget}`,
        async () => {
          const result = await importModule({
            filepath: discoveredFilePath,
            tsconfig,
            format: 'esm',
          });
          return { result, message: `Imported config from ${formattedTarget}` };
        },
      );

      const config = validate(coreConfigSchema, value, {
        filePath: discoveredFilePath,
      });
      logger.info('Configuration is valid ✓');

      const configJson = JSON.stringify(config);
      const configSize = configJson.length;
      const configPreview =
        configSize > 500 ? `${configJson.slice(0, 500)}...` : configJson;

      return config;
    },
    { detail: profiler.spans.cli() },
  );
}
