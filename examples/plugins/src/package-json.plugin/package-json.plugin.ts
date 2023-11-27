import { readJsonFile, readTextFile } from '../../../../dist/packages/utils';
import {
  AuditGroup,
  AuditOutputs,
  CategoryRef,
  PluginConfig,
  RunnerFunction,
} from '../../../../packages/models/src';
import {
  RequiredDependencies,
  dependenciesAudit,
  dependenciesAuditMeta,
} from './dependencies.audit';
import {
  DocumentationOptions,
  documentationAudit,
  documentationAuditMeta,
} from './documentation.audit';
import { licenseAudit, licenseAuditMeta } from './license.audit';
import { typeAudit, typeAuditInfoMeta } from './type.audit';
import { PackageJson, SourceResult, SourceResults } from './types';
import { crawlFileSystem } from './utils';

export const pluginSlug = 'package-json';

const documentationGroupSlug = 'documentation';
export const documentationGroup: AuditGroup = {
  slug: documentationGroupSlug,
  title: 'Documentation specific audits',
  description:
    'A set of audits focusing on the documentation specific properties in package json as well as their relations',
  refs: [
    {
      ...documentationAuditMeta,
      weight: 1,
    },
    {
      ...licenseAuditMeta,
      weight: 1,
    },
  ],
};
export const documentationGroupRef: CategoryRef = {
  slug: documentationGroupSlug,
  type: 'group',
  plugin: pluginSlug,
  weight: 0,
};

const performanceGroupSlug = 'performance';
export const performanceGroup: AuditGroup = {
  slug: performanceGroupSlug,
  title: 'Performance specific audits',
  description: 'A set of audits focusing on compile and runtime performance',
  refs: [
    {
      ...typeAuditInfoMeta,
      weight: 1,
    },
  ],
};
export const performanceGroupRef: CategoryRef = {
  slug: performanceGroupSlug,
  type: 'group',
  plugin: pluginSlug,
  weight: 1,
};

const versionControlGroupSlug = 'version-control';
export const versionControlGroup: AuditGroup = {
  slug: versionControlGroupSlug,
  title: 'Version Control',
  description: 'A set of audits related to version control',
  refs: [
    {
      ...dependenciesAuditMeta,
      weight: 1,
    },
  ],
};
export const versionControlGroupRef: CategoryRef = {
  slug: versionControlGroupSlug,
  type: 'group',
  plugin: pluginSlug,
  weight: 1,
};

export const recommendedRefs: CategoryRef[] = [
  versionControlGroupRef,
  documentationGroupRef,
  performanceGroupRef,
];

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
      documentationAuditMeta,
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
    const { directory, license, requiredDependencies, documentation, type } =
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
      await dependenciesAudit(packageJsonContents, requiredDependencies),
      await licenseAudit(packageJsonContents, license),
      await documentationAudit(packageJsonContents, documentation),
      await typeAudit(packageJsonContents, type),
    ];
  };
}
