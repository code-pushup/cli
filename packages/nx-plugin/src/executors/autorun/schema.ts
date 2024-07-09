import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import {
  CollectExecutorOnlyOptions,
  GeneralExecutorOnlyOptions,
  PersistExecutorOnlyOptions,
} from '../internal/types';

export type AutorunCommandExecutorOnlyOptions = PersistExecutorOnlyOptions &
  CollectExecutorOnlyOptions &
  GeneralExecutorOnlyOptions;
export type AutorunCommandExecutorOptions = Partial<
  {
    upload: Partial<UploadConfig>;
    persist: Partial<PersistConfig>;
  } & AutorunCommandExecutorOnlyOptions
>;
