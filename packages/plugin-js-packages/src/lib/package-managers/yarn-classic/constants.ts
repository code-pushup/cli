import type { OutdatedDependency } from '../../runner/outdated/types';
import type { Yarnv1FieldName } from './types';

export const outdatedtoFieldMapper: Record<
  keyof OutdatedDependency,
  Yarnv1FieldName
> = {
  name: 'Package',
  current: 'Current',
  latest: 'Latest',
  type: 'Package Type',
  url: 'URL',
};

export const REQUIRED_OUTDATED_FIELDS: Yarnv1FieldName[] = [
  'Package',
  'Current',
  'Latest',
  'Package Type',
];
