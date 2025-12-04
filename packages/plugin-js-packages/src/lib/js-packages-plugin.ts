import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Audit, Group, PluginConfig } from '@code-pushup/models';
import {
  type DependencyGroup,
  type JSPackagesPluginConfig,
  type PackageCommand,
  type PackageManagerId,
  dependencyGroups,
} from './config.js';
import { dependencyDocs, dependencyGroupWeights } from './constants.js';
import { packageManagers } from './package-managers/package-managers.js';
import { createRunnerConfig } from './runner/index.js';
import { normalizeConfig } from './utils.js';

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
  config?: JSPackagesPluginConfig,
): Promise<PluginConfig> {
  const {
    packageManager,
    checks,
    depGroups,
    scoreTargets,
    ...jsPackagesPluginConfigRest
  } = await normalizeConfig(config);

  const runnerScriptPath = path.join(
    fileURLToPath(path.dirname(import.meta.url)),
    '..',
    'bin.mjs',
  );

  const packageJson = createRequire(import.meta.url)(
    '../../package.json',
  ) as typeof import('../../package.json');

  return {
    slug: 'js-packages',
    title: 'JS Packages',
    icon: packageManager.icon,
    description:
      'This plugin runs audit to uncover vulnerabilities and lists outdated dependencies. It supports npm, yarn classic, yarn modern, and pnpm package managers.',
    docsUrl: packageManager.docs.homepage,
    packageName: packageJson.name,
    version: packageJson.version,
    audits: createAudits(packageManager.slug, checks, depGroups),
    groups: createGroups(packageManager.slug, checks, depGroups),
    runner: await createRunnerConfig(runnerScriptPath, {
      ...jsPackagesPluginConfigRest,
      checks,
      packageManager: packageManager.slug,
      dependencyGroups: depGroups,
    }),
    ...(scoreTargets && { scoreTargets }),
  };
}

function createGroups(
  id: PackageManagerId,
  checks: PackageCommand[],
  depGroups: DependencyGroup[],
): Group[] {
  const pm = packageManagers[id];
  const supportedAuditDepGroups =
    pm.audit.supportedDepGroups ?? dependencyGroups;
  const compatibleAuditDepGroups = depGroups.filter(group =>
    supportedAuditDepGroups.includes(group),
  );

  const groups: Record<PackageCommand, Group> = {
    audit: {
      slug: `${pm.slug}-audit`,
      title: `${pm.name} audit`,
      description: `Group containing ${pm.name} vulnerabilities.`,
      docsUrl: pm.docs.audit,
      refs: compatibleAuditDepGroups.map(depGroup => ({
        slug: `${pm.slug}-audit-${depGroup}`,
        weight: dependencyGroupWeights[depGroup],
      })),
    },
    outdated: {
      slug: `${pm.slug}-outdated`,
      title: `${pm.name} outdated dependencies`,
      description: `Group containing outdated ${pm.name} dependencies.`,
      docsUrl: pm.docs.outdated,
      refs: depGroups.map(depGroup => ({
        slug: `${pm.slug}-outdated-${depGroup}`,
        weight: dependencyGroupWeights[depGroup],
      })),
    },
  };

  return checks.map(check => groups[check]);
}

function createAudits(
  id: PackageManagerId,
  checks: PackageCommand[],
  depGroups: DependencyGroup[],
): Audit[] {
  const { slug } = packageManagers[id];
  return checks.flatMap(check => {
    const supportedAuditDepGroups =
      packageManagers[id].audit.supportedDepGroups ?? dependencyGroups;

    const compatibleDepGroups =
      check === 'audit'
        ? depGroups.filter(group => supportedAuditDepGroups.includes(group))
        : depGroups;

    return compatibleDepGroups.map(depGroup => ({
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
