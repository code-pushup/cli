import { HistoryOnlyOptions } from '@code-pushup/core';

export type HistoryCliOptions = {
  targetBranch?: string;
  numSteps?: number;
} & Required<HistoryOnlyOptions>;
