import { readdir, stat } from 'fs/promises';
import { basename, join } from 'path';
import {
  AuditOutput,
  AuditOutputs,
  Issue,
  PluginConfig,
} from '../../../dist/packages/models';
import { CategoryRef } from '../../../packages/models/src';
import { formatBytes, pluralize } from '../../../packages/utils/src';

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

  let issues: Issue[] = [];
  const files = await readdir(directory);

  for (const file of files) {
    const filePath = join(directory, file);
    const stats = await stat(filePath);

    if (stats.isFile()) {
      if (pattern) {
        if (file.match(pattern)) {
          issues.push(assertFileSize(filePath, stats.size, budget));
        }
        continue;
      }
      issues.push(assertFileSize(filePath, stats.size, budget));
    } else if (stats.isDirectory()) {
      issues.push(
        ...(await fileSizeIssues({ directory: filePath, pattern, budget })),
      );
    }
  }

  return issues;
}

export function infoMessage(filePath: string, size: number) {
  return `File ${basename(filePath)} is OK. (size: ${formatBytes(size)})`;
}

export function errorMessage(filePath: string, size: number, budget: number) {
  const sizeDifference = size - budget;
  return `File ${basename(filePath)} is ${formatBytes(
    size,
  )} this is ${formatBytes(sizeDifference)} too big. (budget: ${formatBytes(
    budget,
  )})`;
}

export function assertFileSize(
  file: string,
  size: number,
  budget?: number,
): Issue {
  // ensure size and budget if given is positive numbers
  size = Math.max(size, 0);
  budget = budget !== undefined ? Math.max(budget, 0) : budget;
  const budgetExceeded = budget !== undefined ? budget < size : false;
  return {
    message: budgetExceeded
      ? errorMessage(file, size, budget)
      : infoMessage(file, size),
    severity: budgetExceeded ? 'error' : 'info',
    source: {
      file,
    },
  };
}
