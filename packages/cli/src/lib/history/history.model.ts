import { LogOptions } from 'simple-git';
import { HistoryOnlyOptions } from '@code-pushup/core';

export type HistoryCliOptions = {
  targetBranch?: string;
} & LogOptions &
  Required<HistoryOnlyOptions>;
