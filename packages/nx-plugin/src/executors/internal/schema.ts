import { BaseNormalizedExecutorContext } from './types';

export type ExecutorOptionsUploadOnly = {
  // Prefix the project name under upload configuration. A '-' is appended automatically E.g. 'cp' => 'cp-<project>'
  projectPrefix?: string;
};

export type GlobalCommandExecutor = {
  dryRun: boolean;
} & BaseNormalizedExecutorContext &
  ExecutorOptionsUploadOnly;
