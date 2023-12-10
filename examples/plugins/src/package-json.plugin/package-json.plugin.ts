import {crawlFileSystem, readJsonFile, readTextFile,} from '../../../../dist/packages/utils/src';
import {AuditOutputs, PluginConfig, RunnerFunction,} from '../../../../packages/models/src';
import {dependenciesAudit, dependenciesAuditMeta, RequiredDependencies,} from './integration/dependencies.audit';
import {DocumentationOptions,} from './integration/documentation.audit';
import {licenseAudit, licenseAuditMeta} from './integration/license.audit';
import {typeAudit, typeAuditInfoMeta} from './integration/type.audit';
import {PackageJson, SourceResult, SourceResults} from './integration/types';
import {documentationGroup, performanceGroup, versionControlGroup,} from './scoring';

export const pluginSlug = 'package-json';

export type PluginOptions = {
  directory: string;
  requiredDependencies?: RequiredDependencies;
  license?: PackageJson['license'];
  type?: PackageJson['type'];
  documentation?: DocumentationOptions;
};

/**
 * Plugin to validate and assert package.json files in a directory.
 *
 * @example
 * // code-pushup.config.ts
 * import {
 *   create as packageJsonPlugin,
 *   recommendedRef as packageJsonRecommendedRefs
 * } from 'file-size.plugin.ts';
 * export default {
 *   persist: {
 *     outputDir: '.code-pushup',
 *   },
 *   plugins: [
 *     await packageJsonPlugin({
 *       directory: join(process.cwd(), './dist/packages'),
 *       directory: join(process.cwd(), './dist/packages'),
 *             license: 'MIT'
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
 * npx code-pushup --config code-pushup.config.ts
 */
export async function create(options: PluginOptions): Promise<PluginConfig> {
  return {
    slug: pluginSlug,
    title: 'Package Json',
    icon: 'javascript',
    description: 'A plugin to validate package.json files.',
    runner: await runnerFunction(options),
    audits: [
      licenseAuditMeta,
      dependenciesAuditMeta,
      typeAuditInfoMeta,
    ],
    groups: [documentationGroup, versionControlGroup, performanceGroup],
  };
}

type RunnerOptions = PluginOptions;
export async function runnerFunction(
  options: RunnerOptions,
): Promise<RunnerFunction> {
  return async (): Promise<AuditOutputs> => {
    const { directory, license, requiredDependencies, type } =
      options;

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
      await typeAudit(packageJsonContents, type),
      dependenciesAudit(packageJsonContents, requiredDependencies),
    ];
  };
}
