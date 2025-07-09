import type { OutdatedDependency } from '../../runner/outdated/types.js';
import type { YarnClassicFieldName } from './types.js';

export const outdatedtoFieldMapper: Record<
  keyof OutdatedDependency,
  YarnClassicFieldName
> = {
  name: 'Package',
  current: 'Current',
  latest: 'Latest',
  type: 'Package Type',
  url: 'URL',
};

export const REQUIRED_OUTDATED_FIELDS: YarnClassicFieldName[] = [
  'Package',
  'Current',
  'Latest',
  'Package Type',
];
