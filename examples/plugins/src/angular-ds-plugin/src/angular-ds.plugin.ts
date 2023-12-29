import { stat } from 'node:fs/promises';
import { basename } from 'node:path';
import {
  AuditOutput,
  AuditOutputs,
  CategoryRef,
  Issue,
  PluginConfig,
} from '@code-pushup/models';
import {
  crawlFileSystem,
  factorOf,
  pluralizeToken,
  toUnixPath,
} from '../../../../../dist/packages/utils';

export type PluginOptions = {
  directory: string;
  pattern?: string | RegExp;
  budget?: number;
};

type RunnerOptions = PluginOptions;

export const pluginSlug = 'angular-ds';

const angularDsAuditSlug = 'angular-ds-component-styles';
export const auditsMap = {
  [angularDsAuditSlug]: {
    slug: angularDsAuditSlug,
    title: 'Component Styles Audit',
    description:
      'An audit to check style usage in a Angular projcet.',
  },
};
export const audits = Object.values(auditsMap);

export const recommendedRefs: CategoryRef[] = Object.values(auditsMap).map(
  ({ slug }) => ({
    type: 'audit',
    plugin: pluginSlug,
    slug,
    weight: 1,
  }),
);

/**
 * Plugin to measure and assert filesize of files in a directory.
 *
 * @example
 * // code-pushup.config.ts
 * import {
 *   create as angularDsPlugin,
 *   recommendedRef as angularDsRecommendedRefs
 * } from 'file-size.plugin.ts';
 * export default {
 *   persist: {
 *     outputDir: '.code-pushup',
 *   },
 *   plugins: [
 *     await angularDsPlugin({
 *       directory: join(process.cwd(), './ui'),
 *     })
 *   ],
 *   categories: [
 *     {
 *       slug: 'performance',
 *       title: 'Performance',
 *       refs: [
 *         ...fileSizeRecommendedRefs
 *       ]
 *     }
 *   ]
 * }
 */
export function create(options: PluginOptions): PluginConfig {
  return {
    slug: pluginSlug,
    title: 'Angular Design System',
    icon: 'javascript',
    description:
      'A plugin to measure and assert usage of styles in a Angular project.',
    runner: () => runnerFunction(options),
    audits,
  };
}

export async function runnerFunction(
  options: RunnerOptions,
): Promise<AuditOutputs> {
  const angularDsAuditOutput: AuditOutput = {
    slug: angularDsAuditSlug,
    score: 1,
    value: 0,
    displayValue: displayValue(0),
  };

  const issues = await angularDsComponentStylesIssues(options);
  // early exit if no issues
  if (issues.length === 0) {
    return [angularDsAuditOutput];
  }

  const errorCount = issues.filter(filterSeverityError).length;
  return [
    {
      ...angularDsAuditOutput,
      score: factorOf(issues, filterSeverityError),
      value: errorCount,
      displayValue: displayValue(errorCount),
      details: {
        issues,
      },
    },
  ];
}

function filterSeverityError(issue: Issue): issue is Issue {
  return issue.severity === 'error';
}

export function displayValue(numberOfFiles: number): string {
  return `${pluralizeToken('file', numberOfFiles)} oversize`;
}

export function angularDsComponentStylesIssues(options: {
  directory: string;
}): Promise<Issue[]> {
  const { directory } = options;

  return crawlFileSystem({
    directory,
    pattern: /.(scss|css)$/,
    fileTransform: async (file: string) => {
      // const filePath = join(directory, file);
      const stats = await stat(file);

      return assertComponentStyles(file, stats.size);
    },
  });
}

export function infoMessage(filePath: string) {
  return `File ${basename(filePath)} has OK. styles`;
}

export function errorMessage(filePath: string) {
  return `File ${basename(
    filePath,
  )} has wrong styles`;
}

export function assertComponentStyles(
  file: string,
  size?: number,
): Issue {

  // informative issue
  const issue = {
    source: {
      file: toUnixPath(file, { toRelative: true }),
    },
  } satisfies Pick<Issue, 'source'>;

  if (size !== undefined) {
      return {
        ...issue,
        severity: 'error',
        message: errorMessage(file),
      } satisfies Issue;
  }

  // return informative Issue
  return {
    ...issue,
    severity: 'info',
    message: infoMessage(file),
  } satisfies Issue;
}

export default create;
