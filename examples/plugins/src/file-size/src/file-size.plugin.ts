import { stat } from 'node:fs/promises';
import path from 'node:path';
import type {
  AuditOutput,
  AuditOutputs,
  CategoryRef,
  Issue,
  PluginConfig,
} from '@code-pushup/models';
import {
  crawlFileSystem,
  factorOf,
  formatBytes,
  pluralizeToken,
} from '@code-pushup/utils';

export type PluginOptions = {
  directory: string;
  pattern?: string | RegExp;
  budget?: number;
};

type RunnerOptions = PluginOptions;

export const pluginSlug = 'file-size';

const fileSizeAuditSlug = 'file-size-unmodified';
export const auditsMap = {
  [fileSizeAuditSlug]: {
    slug: fileSizeAuditSlug,
    title: 'File Size Audit - Unmodified',
    description:
      'An audit to check JavaScript file size in a directory. The files are not modified and taken as they are.',
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
 *   create as fileSizePlugin,
 *   recommendedRefs as fileSizeRecommendedRefs
 * } from 'file-size.plugin.ts';
 * export default {
 *   persist: {
 *     outputDir: '.code-pushup',
 *   },
 *   plugins: [
 *     await fileSizePlugin({
 *       directory: path.join(process.cwd(), './dist/packages/utils'),
 *       pattern: /\.js$/,
 *       budget: 4200
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
    title: 'File Size',
    icon: 'folder-javascript',
    description: 'A plugin to measure and assert size of files in a directory.',
    runner: () => runnerFunction(options),
    audits,
  };
}

export async function runnerFunction(
  options: RunnerOptions,
): Promise<AuditOutputs> {
  const fileSizeAuditOutput: AuditOutput = {
    slug: fileSizeAuditSlug,
    score: 1,
    value: 0,
    displayValue: displayValue(0),
  };

  const issues = await fileSizeIssues(options);
  // early exit if no issues
  if (issues.length === 0) {
    return [fileSizeAuditOutput];
  }

  const errorCount = issues.filter(filterSeverityError).length;
  return [
    {
      ...fileSizeAuditOutput,
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

export function fileSizeIssues(options: {
  directory: string;
  pattern?: string | RegExp;
  budget?: number;
}): Promise<Issue[]> {
  const { directory, pattern, budget } = options;

  return crawlFileSystem({
    directory,
    pattern,
    fileTransform: async (file: string) => {
      // get size of file
      // const filePath = path.join(directory, file);
      const stats = await stat(file);

      return assertFileSize(file, stats.size, budget);
    },
  });
}

export function infoMessage(filePath: string, size: number) {
  return `File ${path.basename(filePath)} is OK. (size: ${formatBytes(size)})`;
}

export function errorMessage(filePath: string, size: number, budget: number) {
  const sizeDifference = formatBytes(size - budget);
  const byteSize = formatBytes(size);
  const byteBudget = formatBytes(budget);
  return `File ${path.basename(
    filePath,
  )} has ${byteSize}, this is ${sizeDifference} too big. (budget: ${byteBudget})`;
}

export function assertFileSize(
  file: string,
  size: number,
  budget?: number,
): Issue {
  // ensure size positive numbers
  const formattedSize = Math.max(size, 0);

  if (budget !== undefined) {
    // ensure budget is positive numbers
    const formattedBudget = Math.max(budget, 0);
    // return error Issue
    if (budget < formattedSize) {
      return {
        severity: 'error',
        message: errorMessage(file, formattedSize, formattedBudget),
      };
    }
  }

  // return informative Issue
  return {
    severity: 'info',
    message: infoMessage(file, formattedSize),
  };
}

export default create;
