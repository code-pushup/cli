import { CategoryConfig } from '@quality-metrics/models';

export const reportHeadlineText = 'Code Pushup Report';
export const reportOverviewTableHeaders = ['Category', 'Score', 'Audits'];

// @TODO replace with real scoring logic
export function sumRefs(refs: CategoryConfig['refs']) {
  return refs.reduce((sum, { weight }) => sum + weight, 0);
}

export function countWeightedRefs(refs: CategoryConfig['refs']) {
  return refs
    .filter(({ weight }) => weight > 0)
    .reduce((sum, { weight }) => sum + weight, 0);
}

export function calcDuration(start: number, stop?: number): number {
  stop = stop !== undefined ? stop : performance.now();
  return Math.floor(stop - start);
}
