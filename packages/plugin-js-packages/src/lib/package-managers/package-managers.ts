import type { PackageManagerId } from '../config';
import { npmPackageManager } from './npm/npm';
import { pnpmPackageManager } from './pnpm/pnpm';
import type { PackageManager } from './types';
import { yarnv1PackageManager } from './yarn-classic/yarn-classic';
import { yarnv2PackageManager } from './yarn-modern/yarn-modern';

export const packageManagers: Record<PackageManagerId, PackageManager> = {
  npm: npmPackageManager,
  'yarn-classic': yarnv1PackageManager,
  'yarn-modern': yarnv2PackageManager,
  pnpm: pnpmPackageManager,
};
