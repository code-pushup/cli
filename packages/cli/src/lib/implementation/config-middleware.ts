import { readCodePushupConfig } from '@code-pushup/core';
import { CliArgs, CliOnlyGlobalOptions } from './model';
import { CoreConfig, GlobalOptions, UploadConfig } from '@code-pushup/models';

export type ConfigMiddlewareOutput = CoreConfig &
  GlobalOptions &
  Omit<CliOnlyGlobalOptions, 'configPath'>;
export async function configMiddleware<T extends CliArgs>(
  processArgs: T,
): Promise<ConfigMiddlewareOutput> {
  const { configPath, ...cliOptions } = processArgs;
  const importedRc = await readCodePushupConfig(configPath || '');
  const cliConfigArgs = readCoreConfigFromCliArgs(processArgs);

  return {
    ...cliOptions,
    ...importedRc,
    upload: {
      ...(importedRc?.upload as UploadConfig),
      ...cliConfigArgs?.upload,
    },
    persist: {
      ...importedRc?.persist,
      ...cliConfigArgs?.persist,
    },
    plugins: importedRc?.plugins,
    categories: importedRc?.categories,
  } as unknown as ConfigMiddlewareOutput;
}

function readCoreConfigFromCliArgs(args: CliArgs) {
  const parsedProcessArgs = { upload: {}, persist: {} } as {
    upload: Record<string, unknown>;
    persist: Record<string, unknown>;
  };
  for (const key in args) {
    const k = key as keyof Required<CliArgs>;
    switch (key) {
      case 'organization':
      case 'project':
      case 'server':
      case 'apiKey':
        parsedProcessArgs.upload[k] = args[k];
        break;
      case 'outputPath':
      case 'format':
        parsedProcessArgs.persist[k] = args[k];
        break;
      default:
        break;
    }
  }

  return parsedProcessArgs;
}
