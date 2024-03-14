import { type LogOptions } from 'simple-git';
import { HistoryOnlyOptions } from '@code-pushup/core';

export type HistoryCliOptions = {
  targetBranch?: string;
} & Pick<LogOptions, 'maxCount' | 'from' | 'to'> &
  HistoryOnlyOptions;
