import type { PackageManagerId } from '../config.js';
import { npmPackageManager } from './npm/npm.js';
import { pnpmPackageManager } from './pnpm/pnpm.js';
import type { PackageManager } from './types.js';
import { yarnv1PackageManager } from './yarn-classic/yarn-classic.js';
import { yarnv2PackageManager } from './yarn-modern/yarn-modern.js';

export const packageManagers: Record<PackageManagerId, PackageManager> = {
  npm: npmPackageManager,
  'yarn-classic': yarnv1PackageManager,
  'yarn-modern': yarnv2PackageManager,
  pnpm: pnpmPackageManager,
};
