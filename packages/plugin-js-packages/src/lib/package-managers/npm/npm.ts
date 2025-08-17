import { objectToKeys } from '@code-pushup/utils';
import type { DependencyGroup } from '../../config.js';
import { filterAuditResult } from '../../runner/utils.js';
import type { AuditResults, PackageManager } from '../types.js';
import { npmToAuditResult } from './audit-result.js';
import { npmToOutdatedResult } from './outdated-result.js';

const npmDependencyOptions: Record<DependencyGroup, string[]> = {
  prod: ['--omit=dev', '--omit=optional'],
  dev: ['--include=dev', '--omit=optional'],
  optional: ['--include=optional', '--omit=dev'],
};

export const npmPackageManager: PackageManager = {
  slug: 'npm',
  name: 'NPM',
  command: 'npm',
  icon: 'npm',
  docs: {
    homepage: 'https://docs.npmjs.com/',
    audit: 'https://docs.npmjs.com/cli/commands/npm-audit',
    outdated: 'https://docs.npmjs.com/cli/commands/npm-outdated',
  },
  audit: {
    getCommandArgs: groupDep => [
      'audit',
      ...npmDependencyOptions[groupDep],
      '--audit-level=none',
      '--json',
    ],
    unifyResult: npmToAuditResult,
    // prod dependencies need to be filtered out manually since v10
    postProcessResult: (results: AuditResults) => {
      const depGroups = objectToKeys(results);
      const devFilter =
        results.dev && results.prod
          ? filterAuditResult(results.dev, 'name', results.prod)
          : results.dev;
      const optionalFilter =
        results.optional && results.prod
          ? filterAuditResult(results.optional, 'name', results.prod)
          : results.optional;

      return {
        ...(depGroups.includes('prod') && { prod: results.prod }),
        ...(depGroups.includes('dev') && { dev: devFilter }),
        ...(depGroups.includes('optional') && { optional: optionalFilter }),
      };
    },
  },
  outdated: {
    commandArgs: ['outdated', '--long', '--json'],
    unifyResult: npmToOutdatedResult,
  },
};
