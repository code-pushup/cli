import { MaterialIcon } from '@code-pushup/models';
import { PackageManager } from './config';

export const pkgManagerNames: Record<PackageManager, string> = {
  npm: 'NPM',
  'yarn-classic': 'Yarn v1',
  'yarn-modern': 'Yarn v2+',
  pnpm: 'PNPM',
};

export const pkgManagerIcons: Record<PackageManager, MaterialIcon> = {
  npm: 'npm',
  'yarn-classic': 'yarn',
  'yarn-modern': 'yarn',
  pnpm: 'pnpm',
};

export const pkgManagerDocs: Record<PackageManager, string> = {
  npm: 'https://docs.npmjs.com/',
  'yarn-classic': 'https://classic.yarnpkg.com/docs/',
  'yarn-modern': 'https://yarnpkg.com/getting-started',
  pnpm: 'https://pnpm.io/pnpm-cli',
};
export const auditDocs: Record<PackageManager, string> = {
  npm: 'https://docs.npmjs.com/cli/commands/npm-audit',
  'yarn-classic': 'https://classic.yarnpkg.com/docs/cli/audit',
  'yarn-modern': 'https://yarnpkg.com/cli/npm/audit',
  pnpm: 'https://pnpm.io/',
};

export const outdatedDocs: Record<PackageManager, string> = {
  npm: 'https://docs.npmjs.com/cli/commands/npm-outdated',
  'yarn-classic': 'https://classic.yarnpkg.com/docs/cli/outdated/',
  'yarn-modern': 'https://github.com/mskelton/yarn-plugin-outdated',
  pnpm: 'https://pnpm.io/cli/outdated',
};
