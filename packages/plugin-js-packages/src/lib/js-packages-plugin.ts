import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Audit, Group, PluginConfig } from '@code-pushup/models';
import { name, version } from '../../package.json';
import {
  DependencyGroup,
  JSPackagesPluginConfig,
  PackageCommand,
  PackageManagerId,
  dependencyGroups,
  jsPackagesPluginConfigSchema,
} from './config';
import { dependencyDocs, dependencyGroupWeights } from './constants';
import { packageManagers } from './package-managers';
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
  const checks = [...new Set(jsPackagesPluginConfig.checks)];
  const id = jsPackagesPluginConfig.packageManager;
  const pm = packageManagers[id];

  const runnerScriptPath = join(
    fileURLToPath(dirname(import.meta.url)),
    'bin.js',
  );

  return {
    slug: 'js-packages',
    title: 'JS Packages',
    icon: pm.icon,
    description:
      'This plugin runs audit to uncover vulnerabilities and lists outdated dependencies. It supports npm, yarn classic, yarn modern, and pnpm package managers.',
    docsUrl: pm.docs.homepage,
    packageName: name,
    version,
    audits: createAudits(id, checks),
    groups: createGroups(id, checks),
    runner: await createRunnerConfig(runnerScriptPath, jsPackagesPluginConfig),
  };
}

function createGroups(id: PackageManagerId, checks: PackageCommand[]): Group[] {
  const pm = packageManagers[id];
  const supportedAuditDepGroups =
    pm.audit.supportedDepGroups ?? dependencyGroups;
  const groups: Record<PackageCommand, Group> = {
    audit: {
      slug: `${pm.slug}-audit`,
      title: `${pm.name} audit`,
      description: `Group containing ${pm.name} vulnerabilities.`,
      docsUrl: pm.docs.audit,
      refs: supportedAuditDepGroups.map(depGroup => ({
        slug: `${pm.slug}-audit-${depGroup}`,
        weight: dependencyGroupWeights[depGroup],
      })),
    },
    outdated: {
      slug: `${pm.slug}-outdated`,
      title: `${pm.name} outdated dependencies`,
      description: `Group containing outdated ${pm.name} dependencies.`,
      docsUrl: pm.docs.outdated,
      refs: dependencyGroups.map(depGroup => ({
        slug: `${pm.slug}-outdated-${depGroup}`,
        weight: dependencyGroupWeights[depGroup],
      })),
    },
  };

  return checks.map(check => groups[check]);
}

function createAudits(id: PackageManagerId, checks: PackageCommand[]): Audit[] {
  const { slug } = packageManagers[id];
  return checks.flatMap(check => {
    const supportedDepGroups =
      check === 'audit'
        ? packageManagers[id].audit.supportedDepGroups ?? dependencyGroups
        : dependencyGroups;

    return supportedDepGroups.map(depGroup => ({
      slug: `${slug}-${check}-${depGroup}`,
      title: getAuditTitle(slug, check, depGroup),
      description: getAuditDescription(check, depGroup),
      docsUrl: dependencyDocs[depGroup],
    }));
  });
}

function getAuditTitle(
  id: PackageManagerId,
  check: PackageCommand,
  depGroup: DependencyGroup,
) {
  const pm = packageManagers[id];
  return check === 'audit'
    ? `Vulnerabilities for ${pm.name} ${depGroup} dependencies.`
    : `Outdated ${pm.name} ${depGroup} dependencies.`;
}

function getAuditDescription(check: PackageCommand, depGroup: DependencyGroup) {
  return check === 'audit'
    ? `Runs security audit on ${depGroup} dependencies.`
    : `Checks for outdated ${depGroup} dependencies`;
}
