import type { ReleaseType } from 'semver';
import type { IssueSeverity } from '@code-pushup/models';
import { objectToKeys } from '@code-pushup/utils';

export const outdatedSeverity: Record<ReleaseType, IssueSeverity> = {
  major: 'error',
  premajor: 'info',
  minor: 'warning',
  preminor: 'info',
  patch: 'info',
  prepatch: 'info',
  prerelease: 'info',
};

// RELEASE_TYPES directly exported from semver don't work out of the box
export const RELEASE_TYPES = objectToKeys(outdatedSeverity);
