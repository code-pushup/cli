import { PackageManager } from './config';

export const pkgManagerDocs: Record<PackageManager, string> = {
  npm: 'https://docs.npmjs.com/',
  yarn: 'https://classic.yarnpkg.com/lang/en/docs/',
  'yarn-berry': 'https://yarnpkg.com/getting-started',
  pnpm: 'https://pnpm.io/pnpm-cli',
};
export const auditDocs: Record<PackageManager, string> = {
  npm: 'https://docs.npmjs.com/cli/v10/commands/npm-audit',
  yarn: 'https://classic.yarnpkg.com/en/docs/cli/audit',
  'yarn-berry': 'https://yarnpkg.com/cli/npm/audit',
  pnpm: 'https://pnpm.io/',
};

export const outdatedDocs: Record<PackageManager, string> = {
  npm: 'https://docs.npmjs.com/cli/v10/commands/npm-outdated',
  yarn: 'https://classic.yarnpkg.com/lang/en/docs/cli/outdated/',
  'yarn-berry': 'https://github.com/mskelton/yarn-plugin-outdated',
  pnpm: 'https://pnpm.io/cli/outdated',
};
