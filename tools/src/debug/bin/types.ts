// options for `bin/list-processes`
import type { CleanNpmrcOptions, ProcessListOption } from '../utils.js';

export type ListProcessesBinOptions = ProcessListOption & {
  slice?: number;
};

export type KillProcessesBinOptions = ProcessListOption & {
  force: boolean;
};

export type CleanNpmrcBinOptions = CleanNpmrcOptions & {
  force: boolean;
  verbose: boolean;
};
