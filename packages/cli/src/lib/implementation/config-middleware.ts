import { readCodePushupConfig } from '@code-pushup/core';
import { ArgsCliObj, CommandBase } from './model';

export async function configMiddleware<T extends ArgsCliObj>(processArgs: T) {
  const args = processArgs as T;
  const { config, ...cliOptions } = args;
  const importedRc = await readCodePushupConfig(config as string);
  const cliConfigArgs = readCoreConfigFromCliArgs(processArgs);
  const parsedProcessArgs: CommandBase = {
    config,
    verbose: cliOptions.verbose,
    interactive: cliOptions.interactive,
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
      case 'outputDir':
      case 'format':
        parsedProcessArgs.persist[k] = args[k];
        break;
      default:
        break;
    }
  }

  return parsedProcessArgs;
}
