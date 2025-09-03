import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import type {
  CollectExecutorOnlyOptions,
  GeneralExecutorOnlyOptions,
  GlobalExecutorOptions,
  ProjectExecutorOnlyOptions,
} from '../internal/types.js';

export type PrintConfigOptions = { output?: string };
export type AutorunCommandExecutorOnlyOptions = ProjectExecutorOnlyOptions &
  CollectExecutorOnlyOptions &
  GeneralExecutorOnlyOptions;

export type AutorunCommandExecutorOptions = Partial<
  {
    upload: Partial<UploadConfig>;
    persist: Partial<PersistConfig>;
  } & AutorunCommandExecutorOnlyOptions &
    GlobalExecutorOptions
> &
  PrintConfigOptions;
