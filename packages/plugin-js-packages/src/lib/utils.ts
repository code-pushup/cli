import { validate } from '@code-pushup/models';
import {
  type JSPackagesPluginConfig,
  jsPackagesPluginConfigSchema,
} from './config.js';
import { derivePackageManager } from './package-managers/derive-package-manager.js';
import { packageManagers } from './package-managers/package-managers.js';

export async function normalizeConfig(
  config: JSPackagesPluginConfig | undefined,
) {
  const jsPackagesPluginConfig = validate(
    jsPackagesPluginConfigSchema,
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
