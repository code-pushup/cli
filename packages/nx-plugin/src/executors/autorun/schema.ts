import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import {
  GeneralExecutorOnlyOptions,
  PersistExecutorOptions,
} from '../internal/types';

export type AutorunCommandExecutorOptions = Partial<
  {
    upload: Partial<UploadConfig>;
    persist: Partial<PersistConfig>;
  } & PersistExecutorOptions &
    GeneralExecutorOnlyOptions
>;
