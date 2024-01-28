import { HistoryOnlyOptions } from '@code-pushup/core';

export type HistoryCliOptions = {
  gitRestore: string;
} & Required<HistoryOnlyOptions>;
