import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import type {
  CollectExecutorOnlyOptions,
  GeneralExecutorOnlyOptions,
  GlobalExecutorOptions,
  ProjectExecutorOnlyOptions,
} from '../internal/types.js';

export type PrintConfigOptions = { output?: string };
export type PrintConfigCommandExecutorOptions = PrintConfigOptions;
export type CliCommandExecutorOnlyOptions = ProjectExecutorOnlyOptions &
  CollectExecutorOnlyOptions &
  GeneralExecutorOnlyOptions;

export type CliCommandExecutorOptions = Partial<
  {
    upload: Partial<UploadConfig>;
    persist: Partial<PersistConfig>;
  } & CliCommandExecutorOnlyOptions &
    GlobalExecutorOptions
> &
  PrintConfigOptions;
