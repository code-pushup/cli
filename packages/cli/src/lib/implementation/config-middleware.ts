import { readCodePushupConfig } from '@code-pushup/core';
import { GlobalOptions, globalOptionsSchema } from '@code-pushup/models';
import { CommandBase, TerminalArgsObj } from './model';

export async function configMiddleware<T extends TerminalArgsObj>(
  processArgs: T,
) {
  const args = processArgs as T;
  const { configPath, ...cliOptions }: GlobalOptions =
    globalOptionsSchema.parse(args);
  const importedRc = await readCodePushupConfig(configPath);
  const cliConfigArgs = readCoreConfigFromCliArgs(processArgs);
  console.log('importedRc: ', importedRc);
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

function readCoreConfigFromCliArgs(args: TerminalArgsObj): CommandBase {
  const parsedProcessArgs = { upload: {}, persist: {} } as CommandBase;
  for (const key in args) {
    const k = key as keyof TerminalArgsObj;
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
