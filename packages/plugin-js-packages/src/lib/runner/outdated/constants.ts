import { IssueSeverity } from '@code-pushup/models';
import { PackageManager } from '../../config';
import { OutdatedResult, VersionType } from './types';
import { npmToOutdatedResult, yarnv1ToOutdatedResult } from './unify-type';

export const outdatedSeverity: Record<VersionType, IssueSeverity> = {
  major: 'error',
  minor: 'warning',
  patch: 'info',
};

export const outdatedArgs: Record<PackageManager, string[]> = {
  npm: ['--json', '--long'],
  'yarn-classic': ['--json'],
  'yarn-modern': [],
  pnpm: [],
};

export const normalizeOutdatedMapper: Record<
  PackageManager,
  (output: string) => OutdatedResult
> = {
  npm: npmToOutdatedResult,
  'yarn-classic': yarnv1ToOutdatedResult,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'yarn-modern': _ => [],
  pnpm: _ => [],
};
