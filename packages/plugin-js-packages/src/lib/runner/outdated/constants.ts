import { IssueSeverity } from '@code-pushup/models';
import { VersionType } from './types';

export const outdatedSeverity: Record<VersionType, IssueSeverity> = {
  major: 'error',
  minor: 'warning',
  patch: 'info',
};
