import type { PersistConfig, UploadConfig } from '@code-pushup/models';
import type {
  CollectExecutorOnlyOptions,
  GeneralExecutorOnlyOptions,
  GlobalExecutorOptions,
  ProjectExecutorOnlyOptions,
} from '../internal/types.js';

export type PrintConfigOptions = { output?: string };
export type PrintConfigCommandExecutorOptions = PrintConfigOptions;
export type AutorunCommandExecutorOnlyOptions = ProjectExecutorOnlyOptions &
  CollectExecutorOnlyOptions &
  GeneralExecutorOnlyOptions;

export type AutorunCommandExecutorPersistConfig = Required<
  Pick<PersistConfig, 'outputDir'>
> &
  Partial<Omit<PersistConfig, 'outputDir'>>;

export type AutorunCommandExecutorOptions = Partial<
  {
    upload?: Partial<UploadConfig>;
    persist: AutorunCommandExecutorPersistConfig;
  } & AutorunCommandExecutorOnlyOptions &
    GlobalExecutorOptions
> &
  PrintConfigOptions;
