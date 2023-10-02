import { GlobalOptions, globalOptionsSchema } from '../model';
import { readCodePushupConfig } from './read-code-pushup-config';

export class ConfigParseError extends Error {
  constructor(configPath: string) {
    super(`Config file ${configPath} does not exist`);
  }
}

export async function configMiddleware<T = unknown>(processArgs: T) {
  const globalOptions: GlobalOptions = globalOptionsSchema.parse(processArgs);
  const importedRc = await readCodePushupConfig(globalOptions.configPath);
  return {
    ...importedRc,
    ...processArgs,
    ...globalOptions,
  };
}
