import { readdir, stat } from 'fs/promises';
import { basename, join } from 'path';
import { formatBytes, pluralize } from '../../../dist/packages/utils';
import {
  AuditOutput,
  AuditOutputs,
  CategoryRef,
  Issue,
  IssueSeverity,
  PluginConfig,
} from '../../../packages/models/src';

export type PluginOptions = {
  directory: string;
  pattern?: string | RegExp;
  budget?: number;
};

type RunnerOptions = PluginOptions;

export const pluginSlug = 'file-size';

const fileSizeAuditSlug = 'file-size-check';
export const auditsMap = {
  [fileSizeAuditSlug]: {
    slug: fileSizeAuditSlug,
    title: 'File Size Audit',
    description: 'A audit to check JavaScript file size in a directory.',
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
 *   recommendedRef as fileSizeRecommendedRefs
 * } from 'file-size.plugin.ts';
 * export default {
 *   persist: {
 *     outputDir: '.code-pushup',
 *   },
 *   plugins: [
 *     await fileSizePlugin({
 *       directory: join(process.cwd(), './dist/packages/utils'),
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
export async function create(options: PluginOptions): Promise<PluginConfig> {
  return {
    slug: pluginSlug,
    title: 'File Size',
    icon: 'javascript',
    description:
      'A plugin to measure and assert filesize of files in a directory.',
    runner: () => runnerFunction(options),
    audits,
  };
}

export async function runnerFunction(
  options: RunnerOptions,
): Promise<AuditOutputs> {
  let fileSizeAuditOutput: AuditOutput = {
    slug: fileSizeAuditSlug,
    score: 1,
    value: 0,
    displayValue: displayValue(0),
  };

  const issues = await fileSizeIssues(options);
  // early exit if no issues
  if (!issues.length) {
    return [fileSizeAuditOutput];
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  fileSizeAuditOutput = {
    ...fileSizeAuditOutput,
    score: scoreFilesizeAudit(issues.length, errorCount),
    value: errorCount,
    displayValue: displayValue(errorCount),
  };

  if (issues.length) {
    fileSizeAuditOutput = {
      ...fileSizeAuditOutput,
      details: {
        issues,
      },
    };
  }

  return [fileSizeAuditOutput];
}

export function scoreFilesizeAudit(issues: number, errors: number): number {
  if (issues < errors) {
    throw new Error(`issues: ${issues} cannot be less than errors ${errors}`);
  }
  issues = Math.max(issues, 0);
  errors = Math.max(errors, 0);
  return errors > 0 ? Math.abs((issues - errors) / issues) : 1;
}

export function displayValue(numberOfFiles: number): string {
  return `${numberOfFiles} ${
    numberOfFiles === 1 ? 'file' : pluralize('file')
  } oversize`;
}

export async function fileSizeIssues(options: {
  directory: string;
  pattern?: string | RegExp;
  budget?: number;
}): Promise<Issue[]> {
  const { directory, pattern, budget } = options;

  const files = await readdir(directory);
  const issuesPromises = files.map(async file => {
    const filePath = join(directory, file);
    const stats = await stat(filePath);

    // depth first crawling
    if (stats.isDirectory()) {
      return fileSizeIssues({ directory: filePath, pattern, budget });
    }

    if (stats.isFile()) {
      if (pattern !== undefined) {
        if (new RegExp(pattern).test(file)) {
          return assertFileSize(filePath, stats.size, budget);
        }
      } else {
        return assertFileSize(filePath, stats.size, budget);
      }
    }

    // flatMap will remove empty arrays
    return [];
  });

  // Resolve all promises and flatten the array of issues
  const issuesNestedArray = await Promise.all(issuesPromises);
  return issuesNestedArray.flat();
}

export function infoMessage(filePath: string, size: number) {
  return `File ${basename(filePath)} is OK. (size: ${formatBytes(size)})`;
}

export function errorMessage(filePath: string, size: number, budget: number) {
  const sizeDifference = formatBytes(size - budget);
  const byteSize = formatBytes(size);
  const byteBudget = formatBytes(budget);
  return `File ${basename(
    filePath,
  )} has ${byteSize} this is ${sizeDifference} too big. (budget: ${byteBudget})`;
}

export function assertFileSize(
  file: string,
  size: number,
  budget?: number,
): Issue {
  let severity: IssueSeverity = 'info';
  // ensure size positive numbers
  size = Math.max(size, 0);
  let message = infoMessage(file, size);

  if (budget !== undefined) {
    // ensure budget is positive numbers
    budget = Math.max(budget, 0);
    // set severity to error if budget exceeded
    if (budget < size) {
      severity = 'error';
      message = errorMessage(file, size, budget);
    }
  }
  // return Issue
  return {
    message,
    severity,
    source: {
      file,
    },
  };
}
