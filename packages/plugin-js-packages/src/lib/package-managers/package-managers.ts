import type { PackageManagerId } from '../config.js';
import { npmPackageManager } from './npm/npm.js';
import { pnpmPackageManager } from './pnpm/pnpm.js';
import type { PackageManager } from './types.js';
import { yarnClassicPackageManager } from './yarn-classic/yarn-classic.js';
import { yarnModernPackageManager } from './yarn-modern/yarn-modern.js';

export const packageManagers: Record<PackageManagerId, PackageManager> = {
  npm: npmPackageManager,
  'yarn-classic': yarnClassicPackageManager,
  'yarn-modern': yarnModernPackageManager,
  pnpm: pnpmPackageManager,
};
