import type { Issue } from '@code-pushup/models';
import type { CoverageType } from '../../config';

export type LCOVStat = {
  totalFound: number;
  totalHit: number;
  issues: Issue[];
};

export type LCOVStats = Partial<Record<CoverageType, LCOVStat>>;

export type NumberRange = { start: number; end?: number };
