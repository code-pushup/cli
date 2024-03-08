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
import { auditDocs, outdatedDocs, pkgManagerDocs } from './utils';

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
  const features = [...new Set(jsPackagesPluginConfig.features)];

  const runnerScriptPath = join(
    fileURLToPath(dirname(import.meta.url)),
    'bin.js',
  );

  const audits: Record<PackageCommand, Audit> = {
    audit: {
      slug: `${pkgManager}-audit`,
      title: `${pkgManager} audit`,
      description: `Lists ${pkgManager} audit vulnerabilities.`,
      docsUrl: auditDocs[pkgManager],
    },
    outdated: {
      slug: `${pkgManager}-outdated`,
      title: `${pkgManager} outdated dependencies`,
      description: `Lists ${pkgManager} outdated dependencies.`,
      docsUrl: outdatedDocs[pkgManager],
    },
  };

  const group: Group = {
    slug: `${pkgManager}-package-manager`,
    title: `${pkgManager} package manager`,
    description: `Group containing both audit and dependencies command audits for the ${pkgManager} package manager.`,
    docsUrl: pkgManagerDocs[pkgManager],
    refs: features.map(feature => ({
      slug: `${pkgManager}-${feature}`,
      weight: 1,
    })),
  };

  return {
    slug: 'js-packages',
    title: 'Plugin for JS packages',
    icon:
      pkgManager === 'npm' ? 'npm' : pkgManager === 'pnpm' ? 'pnpm' : 'yarn',
    description:
      'This plugin runs audit to uncover vulnerabilities and lists outdated dependencies. It supports npm, yarn classic and berry, pnpm package managers.',
    docsUrl: pkgManagerDocs[pkgManager],
    packageName: name,
    version,
    audits: features.map(feature => audits[feature]),
    groups: [group],
    runner: await createRunnerConfig(runnerScriptPath, jsPackagesPluginConfig),
  };
}
