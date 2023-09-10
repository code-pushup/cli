import { CategoryConfig } from '@quality-metrics/models';

export const reportHeadlineText = 'Code Pushup Report';

// dummy code
export function calcRefs(refs: CategoryConfig['refs']) {
  return refs.reduce((sum, { weight }) => sum + weight, refs.length);
}
