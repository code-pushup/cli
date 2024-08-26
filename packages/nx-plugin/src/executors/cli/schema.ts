import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import {
  CollectExecutorOnlyOptions,
  GeneralExecutorOnlyOptions,
  GlobalExecutorOptions,
  ProjectExecutorOnlyOptions,
} from '../internal/types';

export type AutorunCommandExecutorOnlyOptions = ProjectExecutorOnlyOptions &
  CollectExecutorOnlyOptions &
  GeneralExecutorOnlyOptions;

export type AutorunCommandExecutorOptions = Partial<
  {
    upload: Partial<UploadConfig>;
    persist: Partial<PersistConfig>;
  } & AutorunCommandExecutorOnlyOptions &
    GlobalExecutorOptions
>;
