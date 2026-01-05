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
  return profiler.measureAsync(
    'core:load-rc-config',
    async () => {
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
          const result = await profiler.measureAsync(
            'core:load-rc-config:import-module',
            async () => {
              return importModule({
                filepath: filePath,
                tsconfig,
                format: 'esm',
              });
            },
            {
              color: 'primary',
              success: (result: Awaited<ReturnType<typeof importModule>>) => ({
                properties: [
                  ['File Path', filePath],
                  ['Format', 'esm'],
                ],
                tooltipText: `Successfully imported config from ${path.relative(process.cwd(), filePath)}`,
              }),
            },
          );
          return { result, message: `Imported config from ${formattedTarget}` };
        },
      );

      const config = await profiler.measureAsync(
        'core:load-rc-config:validate-config',
        async () => {
          const validatedConfig = validate(coreConfigSchema, value, {
            filePath,
          });
          logger.info('Configuration is valid ✓');
          return validatedConfig;
        },
        {
          success: (config: CoreConfig) => ({
            properties: [
              ['Plugins', String(config.plugins?.length || 0)],
              ['Categories', String(config.categories?.length || 0)],
            ],
            tooltipText: `Validated config with ${config.plugins?.length || 0} plugins and ${config.categories?.length || 0} categories`,
          }),
        },
      );
      return config;
    },
    {
      success: (config: CoreConfig) => ({
        properties: [
          ['Config File', path.relative(process.cwd(), filePath)],
          ['Plugins', String(config.plugins?.length || 0)],
          ['Categories', String(config.categories?.length || 0)],
        ],
        tooltipText: `Loaded and validated config from ${path.relative(process.cwd(), filePath)}`,
      }),
    },
  );
}

export async function autoloadRc(tsconfig?: string): Promise<CoreConfig> {
  return profiler.measureAsync(
    'core:load-rc-config',
    async () => {
      const configFilePatterns = [
        CONFIG_FILE_NAME,
        `{${SUPPORTED_CONFIG_FILE_FORMATS.join(',')}}`,
      ].join('.');

      logger.debug(`Looking for default config file ${configFilePatterns}`);

      // eslint-disable-next-line functional/no-let
      let ext = '';
      // eslint-disable-next-line functional/no-loop-statements
      ext = await profiler.measureAsync(
        'core:load-rc-config:discover-file',
        async () => {
          for (const extension of SUPPORTED_CONFIG_FILE_FORMATS) {
            const filePath = `${CONFIG_FILE_NAME}.${extension}`;
            const exists = await profiler.measureAsync(
              'core:load-rc-config:discover-file:file-exists',
              async () => {
                return fileExists(filePath);
              },
              {
                success: (exists: boolean) => ({
                  properties: [
                    ['File Path', filePath],
                    ['Exists', String(exists)],
                  ],
                  tooltipText: exists
                    ? `Found config file ${filePath}`
                    : `Config file ${filePath} not found`,
                }),
              },
            );

            if (exists) {
              logger.debug(`Found default config file ${ansis.bold(filePath)}`);
              return extension;
            }
          }
          return '';
        },
        {
          success: (ext: string) => ({
            properties: [
              ['Config File Found', ext ? 'true' : 'false'],
              ...(ext ? [['Extension', ext]] : []),
            ],
            tooltipText: ext
              ? `Discovered config file with extension ${ext}`
              : 'No config file found',
          }),
        },
      );

      if (!ext) {
        throw new Error(
          `No ${configFilePatterns} file present in ${process.cwd()}`,
        );
      }

      return readRcByPath(
        path.join(process.cwd(), `${CONFIG_FILE_NAME}.${ext}`),
        tsconfig,
      );
    },
    {
      color: 'primary',
      success: (config: CoreConfig) => ({
        properties: [
          ['Auto-loaded', 'true'],
          ['Plugins', String(config.plugins?.length || 0)],
          ['Categories', String(config.categories?.length || 0)],
        ],
        tooltipText: `Auto-loaded config with ${config.plugins?.length || 0} plugins and ${config.categories?.length || 0} categories`,
      }),
    },
  );
}
