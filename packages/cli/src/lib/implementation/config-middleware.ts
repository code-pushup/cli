import { GlobalOptions, globalOptionsSchema } from '@code-pushup/models';
import { ArgsCliObj, CommandBase } from './model';
import { readCodePushupConfig } from './read-code-pushup-config';

export class ConfigPathError extends Error {
  constructor(configPath: string) {
    super(`Config path ${configPath} is not a file.`);
  }
}

export async function configMiddleware<T extends ArgsCliObj>(processArgs: T) {
  const args = processArgs as T;
  const { configPath, ...cliOptions }: GlobalOptions =
    globalOptionsSchema.parse(args);
  const importedRc = await readCodePushupConfig(configPath);
  const cliConfigArgs = readCoreConfigFromCliArgs(processArgs);
  const parsedProcessArgs: CommandBase = {
    ...cliOptions,
    ...(importedRc || {}),
    upload: {
      ...importedRc.upload,
      ...cliConfigArgs.upload,
    },
    persist: {
      ...importedRc.persist,
      ...cliConfigArgs.persist,
    },
    plugins: importedRc.plugins,
    categories: importedRc.categories,
  };

  return parsedProcessArgs;
}

function readCoreConfigFromCliArgs(args: ArgsCliObj): CommandBase {
  const parsedProcessArgs = { upload: {}, persist: {} } as CommandBase;
  for (const key in args) {
    const k = key as keyof ArgsCliObj;
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
