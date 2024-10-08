import {
  type JSPackagesPluginConfig,
  jsPackagesPluginConfigSchema,
} from './config';
import { packageManagers } from './package-managers';
import { derivePackageManager } from './package-managers/derive-package-manager';

export async function normalizeConfig(config?: JSPackagesPluginConfig) {
  const jsPackagesPluginConfig = jsPackagesPluginConfigSchema.parse(
    config ?? {},
  );

  const {
    packageManager,
    dependencyGroups: dependencyGroupsCfg = [],
    checks: checksCfg = [],
    ...jsPackagesPluginConfigRest
  } = jsPackagesPluginConfig;
  const checks = [...new Set(checksCfg)];
  const depGroups = [...new Set(dependencyGroupsCfg)];
  const pm = packageManagers[packageManager ?? (await derivePackageManager())];

  return {
    ...jsPackagesPluginConfigRest,
    packageManager: pm,
    checks,
    depGroups,
  };
}
