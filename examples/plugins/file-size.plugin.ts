import { readdir, stat } from 'fs/promises';
import { basename, join } from 'path';
import {
  AuditOutput,
  AuditOutputs,
  Issue,
  PluginConfig,
} from '../../dist/packages/models';
import { formatBytes, pluralize } from '../../dist/packages/utils';
import { CategoryRef } from '../../packages/models/src';

export type PluginOptions = {
  directory: string;
  pattern?: string | RegExp;
  budget?: number;
};

type RunnerOptions = PluginOptions;

export const pluginSlug = 'file-size';

const fileSizeAuditSlug = 'file-size-check';
const audits = {
  [fileSizeAuditSlug]: {
    slug: fileSizeAuditSlug,
    title: 'File Size Audit',
    description: 'A audit to check JavaScript file size in a directory.',
  },
};

export const recommendedRefs: CategoryRef[] = Object.values(audits).map(
  ({ slug }) => ({
    type: 'audit',
    plugin: pluginSlug,
    slug,
    weight: 1,
  }),
);

/**
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
    audits: Object.values(audits),
  };
}

async function runnerFunction(options: RunnerOptions): Promise<AuditOutputs> {
  let fileSizeAuditOutput: AuditOutput = {
    slug: fileSizeAuditSlug,
    score: 0,
    value: 0,
    displayValue: `${0} ${pluralize('file')}`,
  };

  const issues = await fileSizePlugin(options);
  // early exit if no issues
  if (!issues.length) {
    return [fileSizeAuditOutput];
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const score = errorCount > 0 ? (errorCount / issues.length - 1) * -1 : 0;

  fileSizeAuditOutput = {
    ...fileSizeAuditOutput,
    score,
    value: errorCount,
    displayValue: `${errorCount} ${
      errorCount === 1 ? 'file' : pluralize('file')
    }`,
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

async function fileSizePlugin(options: {
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
        ...(await fileSizePlugin({ directory: filePath, pattern, budget })),
      );
    }
  }

  return issues;
}

function assertFileSize(
  filePath: string,
  size: number,
  budget?: number,
): Issue {
  const sizeSmallerThanBudget = budget ? size < budget : true;
  // write how moch bigger
  const errorMsg = `File ${basename(filePath)} is ${formatBytes(
    size - budget,
  )} bytes too big. ( budget: ${formatBytes(budget)})`;
  return {
    message: sizeSmallerThanBudget ? `File ${basename(filePath)} OK` : errorMsg,
    severity: sizeSmallerThanBudget ? 'info' : 'error',
    source: {
      file: filePath,
    },
  };
}
