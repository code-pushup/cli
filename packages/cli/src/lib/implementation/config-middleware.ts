import { existsSync } from 'node:fs';
import { bundleRequire } from 'bundle-require';
import { CommandBase, commandBaseSchema } from '../../index';
import { GlobalCliArgs, globalCliArgsSchema } from '@quality-metrics/models';

export class ConfigParseError extends Error {
  constructor(configPath: string) {
    super(`Config file ${configPath} does not exist`);
  }
}

export async function configMiddleware<T = unknown>(
  processArgs: T,
): Promise<CommandBase> {
  const globalCfg: GlobalCliArgs = globalCliArgsSchema.parse(processArgs);
  const { configPath } = globalCfg;
  if (!existsSync(configPath)) {
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
