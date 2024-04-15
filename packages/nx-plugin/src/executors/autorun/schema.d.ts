import { type PersistConfig, type UploadConfig } from '@code-pushup/models';
import { GlobalOptions } from '../../utils/config';
import { ExecutorOnlyOptions } from './types';

// @TODO add RunCommandOptions
export type AutorunCommandExecutorSchema = Partial<ExecutorOnlyOptions> &
  Partial<GlobalOptions> &
  Partial<{ upload: UploadConfig }> &
  Partial<{ persist: PersistConfig }>;
