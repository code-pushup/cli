import {
  AuditOutputs,
  PluginConfig,
  RunnerFunction,
} from '@code-pushup/models';
import {
  crawlFileSystem,
  readJsonFile,
  readTextFile,
} from '@code-pushup/utils';
import { pluginSlug } from './constants';
import {
  RequiredDependencies,
  dependenciesAudit,
  dependenciesAuditMeta,
} from './integration/dependencies.audit';
import { licenseAudit, licenseAuditMeta } from './integration/license.audit';
import { typeAudit, typeAuditInfoMeta } from './integration/type.audit';
import { PackageJson, SourceResult, SourceResults } from './integration/types';
import {
  documentationGroup,
  performanceGroup,
  versionControlGroup,
} from './scoring';

export type PluginOptions = {
  directory: string;
  license?: PackageJson['license'];
  type?: PackageJson['type'];
} & RequiredDependencies;

/**
 * Plugin to validate and assert package.json files in a directory.
 *
 * @example
 * // code-pushup.config.ts
 * import {
 *   create as packageJsonPlugin,
 *   recommendedRefs as packageJsonRecommendedRefs
 * } from 'package-json.plugin.ts';
 * export default {
 *   persist: {
 *     outputDir: '.code-pushup',
 *   },
 *   plugins: [
 *     packageJsonPlugin({
 *       directory: './dist/packages',
 *       license: 'MIT',
 *     })
 *   ],
 *   categories: [
 *     {
 *       slug: 'version-control',
 *       title: 'Version Control',
 *       refs: [
 *         ...packageJsonRecommendedRefs
 *       ]
 *     }
 *   ]
 * }
 *
 * // terminal
 * npx code-pushup
 */
export function create(options: PluginOptions): PluginConfig {
  return {
    slug: pluginSlug,
    title: 'Package Json',
    icon: 'npm',
    description: 'A plugin to validate package.json files.',
    runner: runnerFunction(options),
    audits: [licenseAuditMeta, dependenciesAuditMeta, typeAuditInfoMeta],
    groups: [documentationGroup, versionControlGroup, performanceGroup],
  };
}

type RunnerOptions = PluginOptions;
export function runnerFunction(options: RunnerOptions): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const {
      directory,
      license,
      dependencies = {},
      devDependencies = {},
      optionalDependencies = {},
      type,
    } = options;

    const packageJsonContents: SourceResults = await crawlFileSystem({
      directory,
      pattern: 'package.json',
      fileTransform: async (filePath): Promise<SourceResult> => {
        const content = await readTextFile(filePath);
        const json = await readJsonFile<PackageJson>(filePath);
        return { file: filePath, json, content };
      },
    });

    return [
      licenseAudit(packageJsonContents, license),
      typeAudit(packageJsonContents, type),
      dependenciesAudit(packageJsonContents, {
        dependencies,
        devDependencies,
        optionalDependencies,
      }),
    ];
  };
}

export default create;
