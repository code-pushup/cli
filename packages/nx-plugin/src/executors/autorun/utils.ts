import { globalConfig, persistConfig, uploadConfig } from '../internal/config';
import { NormalizedExecutorContext } from '../internal/context';
import {
  AutorunCommandExecutorOnlyOptions,
  AutorunCommandExecutorOptions,
} from './schema';

export function autorunExecutorOnlyConfig(
  options: Partial<AutorunCommandExecutorOnlyOptions>,
): AutorunCommandExecutorOnlyOptions {
  // For better debugging use `--verbose --no-progress` as default
  const { projectPrefix, dryRun, onlyPlugins } = options;
  return {
    ...(projectPrefix == null ? {} : { projectPrefix }),
    ...(dryRun == null ? {} : { dryRun: dryRun }),
    ...(onlyPlugins ? { onlyPlugins } : {}),
  };
}

export async function getExecutorOptions(
  options: Partial<AutorunCommandExecutorOptions>,
  normalizedContext: NormalizedExecutorContext,
): Promise<AutorunCommandExecutorOptions> {
  const { projectPrefix, ...cliOptions } = options;
  return {
    ...globalConfig(cliOptions),
    ...autorunExecutorOnlyConfig(options),
    persist: persistConfig(
      { projectPrefix, ...cliOptions.persist },
      normalizedContext,
    ),
    upload: await uploadConfig(
      { projectPrefix, ...cliOptions.upload },
      normalizedContext,
    ),
  };
}
