import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Audit, Group, PluginConfig } from '@code-pushup/models';
import { name, version } from '../../package.json';
import {
  JSPackagesPluginConfig,
  PackageCommand,
  jsPackagesPluginConfigSchema,
} from './config';
import { createRunnerConfig } from './runner';
import {
  auditDocs,
  outdatedDocs,
  pkgManagerDocs,
  pkgManagerIcons,
  pkgManagerNames,
} from './utils';

/**
 * Instantiates Code PushUp JS packages plugin for core config.
 *
 * @example
 * import coveragePlugin from '@code-pushup/js-packages-plugin'
 *
 * export default {
 *   // ... core config ...
 *   plugins: [
 *     // ... other plugins ...
 *     await jsPackagesPlugin()
 *   ]
 * }
 *
 * @returns Plugin configuration.
 */
export async function jsPackagesPlugin(
  config: JSPackagesPluginConfig = {},
): Promise<PluginConfig> {
  const jsPackagesPluginConfig = jsPackagesPluginConfigSchema.parse(config);
  const pkgManager = jsPackagesPluginConfig.packageManager;
  const checks = [...new Set(jsPackagesPluginConfig.checks)];

  const runnerScriptPath = join(
    fileURLToPath(dirname(import.meta.url)),
    'bin.js',
  );

  const audits: Record<PackageCommand, Audit> = {
    audit: {
      slug: `${pkgManager}-audit`,
      title: `${pkgManagerNames[pkgManager]} audit`,
      description: `Lists ${pkgManagerNames[pkgManager]} audit vulnerabilities.`,
      docsUrl: auditDocs[pkgManager],
    },
    outdated: {
      slug: `${pkgManager}-outdated`,
      title: `${pkgManagerNames[pkgManager]} outdated dependencies`,
      description: `Lists ${pkgManagerNames[pkgManager]} outdated dependencies.`,
      docsUrl: outdatedDocs[pkgManager],
    },
  };

  const group: Group = {
    slug: `${pkgManager}-package-manager`,
    title: `${pkgManagerNames[pkgManager]} package manager`,
    description: `Group containing both audit and dependencies command audits for the ${pkgManagerNames[pkgManager]} package manager.`,
    docsUrl: pkgManagerDocs[pkgManager],
    refs: checks.map(check => ({
      slug: `${pkgManager}-${check}`,
      weight: 1,
    })),
  };

  return {
    slug: 'js-packages',
    title: 'Plugin for JS packages',
    icon: pkgManagerIcons[pkgManager],
    description:
      'This plugin runs audit to uncover vulnerabilities and lists outdated dependencies. It supports npm, yarn classic and berry, pnpm package managers.',
    docsUrl: pkgManagerDocs[pkgManager],
    packageName: name,
    version,
    audits: checks.map(check => audits[check]),
    groups: [group],
    runner: await createRunnerConfig(runnerScriptPath, jsPackagesPluginConfig),
  };
}
