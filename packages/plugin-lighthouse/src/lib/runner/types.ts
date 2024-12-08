import type { LighthouseOptions } from '../types.js';

export type NormalizedFlags = {
  // normalized
  chromeFlags: string[];
  onlyAudits: string[];
  onlyCategories: string[];
  skipAudits: string[];
};
export type LighthouseCliFlags = Omit<
  LighthouseOptions,
  keyof NormalizedFlags
> &
  NormalizedFlags;
