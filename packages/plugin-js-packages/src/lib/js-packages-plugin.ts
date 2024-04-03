import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Audit, Group, PluginConfig } from '@code-pushup/models';
import { name, version } from '../../package.json';
import {
  DependencyGroup,
  JSPackagesPluginConfig,
  PackageCommand,
  PackageManager,
  dependencyGroups,
  jsPackagesPluginConfigSchema,
} from './config';
import { dependencyDocs, dependencyGroupWeights } from './constants';
import { createRunnerConfig } from './runner';
import { adapters } from './runner/package-managers';

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
  const adapter = adapters[pkgManager];

  const runnerScriptPath = join(
    fileURLToPath(dirname(import.meta.url)),
    'bin.js',
  );

  return {
    slug: 'js-packages',
    title: 'JS Packages',
    icon: adapter.icon,
    description:
      'This plugin runs audit to uncover vulnerabilities and lists outdated dependencies. It supports npm, yarn classic, yarn modern, and pnpm package managers.',
    docsUrl: adapter.docs.homepage,
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
  const adapter = adapters[pkgManager];
  const supportedAuditDepGroups =
    adapter.audit.supportedDepGroups ?? dependencyGroups;
  const groups: Record<PackageCommand, Group> = {
    audit: {
      slug: `${adapter.slug}-audit`,
      title: `${adapter.name} audit`,
      description: `Group containing ${adapter.name} vulnerabilities.`,
      docsUrl: adapter.docs.audit,
      refs: supportedAuditDepGroups.map(dep => ({
        slug: `${adapter.slug}-audit-${dep}`,
        weight: dependencyGroupWeights[dep],
      })),
    },
    outdated: {
      slug: `${adapter.slug}-outdated`,
      title: `${adapter.name} outdated dependencies`,
      description: `Group containing outdated ${adapter.name} dependencies.`,
      docsUrl: adapter.docs.outdated,
      refs: dependencyGroups.map(dep => ({
        slug: `${adapter.slug}-outdated-${dep}`,
        weight: dependencyGroupWeights[dep],
      })),
    },
  };

  return checks.map(check => groups[check]);
}

function createAudits(
  pkgManager: PackageManager,
  checks: PackageCommand[],
): Audit[] {
  const { slug } = adapters[pkgManager];
  return checks.flatMap(check => {
    const supportedDepGroups =
      check === 'audit'
        ? adapters[pkgManager].audit.supportedDepGroups ?? dependencyGroups
        : dependencyGroups;

    return supportedDepGroups.map(deps => ({
      slug: `${slug}-${check}-${deps}`,
      title: getAuditTitle(slug, check, deps),
      description: getAuditDescription(check, deps),
      docsUrl: dependencyDocs[deps],
    }));
  });
}

function getAuditTitle(
  pkgManager: PackageManager,
  check: PackageCommand,
  dependencyType: DependencyGroup,
) {
  const adapter = adapters[pkgManager];
  return check === 'audit'
    ? `Vulnerabilities for ${adapter.name} ${dependencyType} dependencies.`
    : `Outdated ${adapter.name} ${dependencyType} dependencies.`;
}

function getAuditDescription(
  check: PackageCommand,
  dependencyType: DependencyGroup,
) {
  return check === 'audit'
    ? `Runs security audit on ${dependencyType} dependencies.`
    : `Checks for outdated ${dependencyType} dependencies`;
}
