// Yarn v2 does not currently audit optional dependencies
import type { DependencyGroup } from '../../config.js';
import type { PackageManager } from '../types.js';
import { yarnBerryToAuditResult } from './audit-result.js';
import { yarnBerryToOutdatedResult } from './outdated-result.js';

// see https://github.com/yarnpkg/berry/blob/master/packages/plugin-npm-cli/sources/npmAuditTypes.ts#L5
const yarnModernEnvironmentOptions: Record<DependencyGroup, string> = {
  prod: 'production',
  dev: 'development',
  optional: '',
};

export const yarnModernPackageManager: PackageManager = {
  slug: 'yarn-modern',
  name: 'yarn-modern',
  command: 'yarn',
  icon: 'yarn',
  docs: {
    homepage: 'https://yarnpkg.com/getting-started',
    audit: 'https://yarnpkg.com/cli/npm/audit',
    outdated: 'https://github.com/mskelton/yarn-plugin-outdated',
  },
  audit: {
    getCommandArgs: groupDep => {
      const environment = yarnModernEnvironmentOptions[groupDep];
      return [
        'npm',
        'audit',
        ...(environment ? [`--environment=${environment}`] : []),
        '--json',
      ];
    },
    supportedDepGroups: ['prod', 'dev'], // Yarn v2 does not support audit for optional dependencies
    unifyResult: yarnBerryToAuditResult,
    ignoreExitCode: true,
  },
  outdated: {
    commandArgs: [
      'outdated',
      '--workspace=.', // filter out other packages in case of Yarn workspaces
      '--url',
      '--json',
    ],
    unifyResult: yarnBerryToOutdatedResult,
  },
};
