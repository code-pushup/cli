import { GlobalCliArgsSchema, globalCliArgsSchema } from '@quality-metrics/models';
import { BaseCommandSchema, baseCommandSchema } from '../../index';
import { existsSync } from 'node:fs';
import { ArgumentsCamelCase } from 'yargs';
import {bundleRequire} from "bundle-require";

export class ConfigParseError extends Error {
  constructor(configPath: string) {
    super(`Config file ${configPath} does not exist`);
  }
}

export function applyConfigMiddlewareToHandler(
  handler: (processArgs: BaseCommandSchema) => Promise<void>,
) {
  return (processArgs: Partial<GlobalCliArgsSchema>): Promise<void> => {
    const globalCfg: GlobalCliArgsSchema =
      globalCliArgsSchema.parse(processArgs);

    if (!existsSync(globalCfg.configPath)) {
      throw new ConfigParseError(globalCfg.configPath);
    }

    return import(globalCfg.configPath)
      .then(m => m.default)
      .then(exportedConfig => {
        const configFromFile = baseCommandSchema.parse({
          ...globalCfg,
          ...exportedConfig,
        });
        return handler(configFromFile);
      });
  };
}

export async function configMiddleware<T = Record<string, any>>(
  processArgs: ArgumentsCamelCase<T>,
) {
  const globalCfg: GlobalCliArgsSchema = globalCliArgsSchema.parse(processArgs);
  const {configPath} = globalCfg;
  if (!existsSync(configPath)) {
    throw new ConfigParseError(configPath);
  }

  const { mod } = await bundleRequire({
    filepath: configPath,
    format: 'esm',
  });
  const exportedConfig = mod.default || mod;

  return baseCommandSchema.parse({
        ...globalCfg,
        ...exportedConfig,
      });
}
