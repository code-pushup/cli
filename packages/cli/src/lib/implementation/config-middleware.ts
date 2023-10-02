import { bundleRequire } from 'bundle-require';
import { stat } from 'fs/promises';
import { GlobalOptions, globalOptionsSchema } from '../model';
import { CommandBase, commandBaseSchema } from './model';

export class ConfigParseError extends Error {
  constructor(configPath: string) {
    super(`Config file ${configPath} does not exist`);
  }
}

export async function configMiddleware<T = unknown>(
  processArgs: T,
): Promise<CommandBase> {
  const globalCfg: GlobalOptions = globalOptionsSchema.parse(processArgs);
  const { configPath } = globalCfg;
  try {
    const stats = await stat(configPath);
    if (!stats.isFile) {
      throw new ConfigParseError(configPath);
    }
  } catch (err) {
    throw new ConfigParseError(configPath);
  }

  const { mod } = await bundleRequire({
    filepath: globalCfg.configPath,
    format: 'esm',
  });
  const exportedConfig = mod.default || mod;

  return commandBaseSchema.parse({
    ...globalCfg,
    ...exportedConfig,
    ...processArgs,
  });
}
