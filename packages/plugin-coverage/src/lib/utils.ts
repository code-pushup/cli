import type { CoverageType } from './config.js';

export const coverageDescription: Record<CoverageType, string> = {
  branch:
    'Measures how many branches were executed after conditional statements in at least one test.',
  line: 'Measures how many lines of code were executed in at least one test.',
  function: 'Measures how many functions were called in at least one test.',
};

export const coverageTypeWeightMapper: Record<CoverageType, number> = {
  /* eslint-disable @typescript-eslint/no-magic-numbers */
  function: 6,
  branch: 3,
  line: 1,
  /* eslint-enable @typescript-eslint/no-magic-numbers */
};
