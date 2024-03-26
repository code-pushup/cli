import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Audit, Group, PluginConfig } from '@code-pushup/models';
import { name, version } from '../../package.json';
import {
  DependencyGroup,
  JSPackagesPluginConfig,
  PackageCommand,
  PackageManager,
  jsPackagesPluginConfigSchema,
} from './config';
import {
  auditDocs,
  dependencyDocs,
  outdatedDocs,
  pkgManagerDocs,
  pkgManagerIcons,
  pkgManagerNames,
} from './constants';
import { createRunnerConfig } from './runner';

/**
 * Instantiates Code PushUp JS packages plugin for core config.
 *
 * @example
 * import jsPackagesPlugin from '@code-pushup/js-packages-plugin'
 *
 * export default {
 *   // ... core config ...
 *   plugins: [
 *     // ... other plugins ...
 *     await jsPackagesPlugin({ packageManager: 'npm' })
 *   ]
 * }
 *
 * @returns Plugin configuration.
 */

export async function jsPackagesPlugin(
  config: JSPackagesPluginConfig,
): Promise<PluginConfig> {
  const jsPackagesPluginConfig = jsPackagesPluginConfigSchema.parse(config);
  const pkgManager = jsPackagesPluginConfig.packageManager;
  const checks = [...new Set(jsPackagesPluginConfig.checks)];

  const runnerScriptPath = join(
    fileURLToPath(dirname(import.meta.url)),
    'bin.js',
  );

  return {
    slug: 'js-packages',
    title: 'Plugin for JS packages',
    icon: pkgManagerIcons[pkgManager],
    description:
      'This plugin runs audit to uncover vulnerabilities and lists outdated dependencies. It supports npm, yarn classic and berry, pnpm package managers.',
    docsUrl: pkgManagerDocs[pkgManager],
    packageName: name,
    version,
    audits: createAudits(pkgManager, checks),
    groups: createGroups(pkgManager, checks),
    runner: await createRunnerConfig(runnerScriptPath, jsPackagesPluginConfig),
  };
}

function createGroups(
  pkgManager: PackageManager,
  checks: PackageCommand[],
): Group[] {
  const groups: Record<PackageCommand, Group> = {
    audit: {
      slug: `${pkgManager}-audit`,
      title: `${pkgManagerNames[pkgManager]} audit`,
      description: `Group containing ${pkgManagerNames[pkgManager]} vulnerabilities.`,
      docsUrl: auditDocs[pkgManager],
      refs: [
        // eslint-disable-next-line no-magic-numbers
        { slug: `${pkgManager}-audit-prod`, weight: 8 },
        { slug: `${pkgManager}-audit-dev`, weight: 1 },
        { slug: `${pkgManager}-audit-optional`, weight: 1 },
      ],
    },
    outdated: {
      slug: `${pkgManager}-outdated`,
      title: `${pkgManagerNames[pkgManager]} outdated dependencies`,
      description: `Group containing outdated ${pkgManagerNames[pkgManager]} dependencies.`,
      docsUrl: outdatedDocs[pkgManager],
      refs: [
        // eslint-disable-next-line no-magic-numbers
        { slug: `${pkgManager}-outdated-prod`, weight: 8 },
        { slug: `${pkgManager}-outdated-dev`, weight: 1 },
        { slug: `${pkgManager}-outdated-optional`, weight: 1 },
      ],
    },
  };

  return checks.map(check => groups[check]);
}

function createAudits(
  pkgManager: PackageManager,
  checks: PackageCommand[],
): Audit[] {
  return checks.flatMap(check => [
    {
      slug: `${pkgManager}-${check}-prod`,
      title: getAuditTitle(pkgManager, check, 'prod'),
      description: getAuditDescription(check, 'prod'),
      docsUrl: dependencyDocs.prod,
    },
    {
      slug: `${pkgManager}-${check}-dev`,
      title: getAuditTitle(pkgManager, check, 'dev'),
      description: getAuditDescription(check, 'dev'),
      docsUrl: dependencyDocs.dev,
    },
    {
      slug: `${pkgManager}-${check}-optional`,
      title: getAuditTitle(pkgManager, check, 'optional'),
      description: getAuditDescription(check, 'optional'),
      docsUrl: dependencyDocs.optional,
    },
  ]);
}

function getAuditTitle(
  pkgManager: PackageManager,
  check: PackageCommand,
  dependencyType: DependencyGroup,
) {
  return check === 'audit'
    ? `Vulnerabilities for ${pkgManagerNames[pkgManager]} ${dependencyType} dependencies.`
    : `Outdated ${pkgManagerNames[pkgManager]} ${dependencyType} dependencies.`;
}

function getAuditDescription(
  check: PackageCommand,
  dependencyType: DependencyGroup,
) {
  return check === 'audit'
    ? `Runs security audit on ${dependencyType} dependencies.`
    : `Checks for outdated ${dependencyType} dependencies`;
}
