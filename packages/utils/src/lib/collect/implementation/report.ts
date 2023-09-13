import { CategoryConfig } from '@quality-metrics/models';

export const reportHeadlineText = 'Code Pushup Report';

// dummy code
export function sumRefs(refs: CategoryConfig['refs']) {
  return refs.reduce((sum, { weight }) => sum + weight, refs.length);
}
export function countWeightedRefs(refs: CategoryConfig['refs']) {
  return refs.filter(({weight}) => weight > 0)
    .reduce((sum, { weight }) => sum + weight, refs.length);
}
