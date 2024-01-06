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
  findLineNumberInText,
  pluralizeToken,
  readTextFile,
  toUnixPath,
} from '../../../../../dist/packages/utils';
import { retrieveNonVariableCssTokens } from './utils';

export type PluginOptions = {
  directory: string;
};

type RunnerOptions = PluginOptions;

export const pluginSlug = 'css-token';

const cssTokenAuditSlug = 'css-token-usage';
export const auditsMap = {
  [cssTokenAuditSlug]: {
    slug: cssTokenAuditSlug,
    title: 'CSS Token Audit - ???',
    description:
      'An audit to check CSS token usage for Angular in a directory.',
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
 * Plugin to measure css token usage for Angular in a directory.
 *
 * @example
 * // code-pushup.config.ts
 * import {
 *   create as cssTokenPlugin,
 *   recommendedRef as cssTokenRecommendedRefs
 * } from 'css-token.plugin.ts';
 * export default {
 *   persist: {
 *     outputDir: '.code-pushup',
 *   },
 *   plugins: [
 *     await cssTokenPlugin({
 *       directory: join(process.cwd(), './dist/packages/utils'),
 *     })
 *   ],
 *   categories: [
 *     {
 *       slug: 'bug-prevention',
 *       title: 'Bug Prevention',
 *       refs: [
 *         ...cssTokenRecommendedRefs
 *       ]
 *     }
 *   ]
 * }
 */
export function create(options: PluginOptions): PluginConfig {
  return {
    slug: pluginSlug,
    title: 'CSS Token Usage',
    icon: 'css',
    description:
      'Plugin to measure css token usage for Angular in a directory.',
    runner: () => runnerFunction(options),
    audits,
  };
}

export async function runnerFunction(
  options: RunnerOptions,
): Promise<AuditOutputs> {
  const cssTokenAuditOutput: AuditOutput = {
    slug: cssTokenAuditSlug,
    score: 1,
    value: 0,
    displayValue: displayValue(0),
  };

  const issues = await cssTokenIssues(options);
  // early exit if no issues
  if (issues.length === 0) {
    return [cssTokenAuditOutput];
  }

  const errorCount = issues.filter(filterSeverityError).length;
  return [
    {
      ...cssTokenAuditOutput,
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

export function cssTokenIssues(options: {
  directory: string;
}): Promise<Issue[]> {
  const { directory } = options;

  return crawlFileSystem({
    directory,
    pattern: '.(css|scss|sass|ts|html)$',
    fileTransform: async (file: string) => {
      // Fetch file content for all files
      // Check content for all files
      // 1. CSS or SCCS OR SASS files, just parse and check
      // 2. Angular/ts files, inline styles and template styles as components referencing other files are 1. case

      // Tokens
      // CSS Colors: rgb, rgba, hsl, hsla, hex, named colors

      // get size of file
      // const filePath = join(directory, file);
      const fileContent = await readTextFile(file);

      return assertTokenUsage(file, fileContent);
    },
  }).then(arr => arr.flatMap(arr => arr));
}

export function infoMessage(filePath: string) {
  return `File ${basename(filePath)} is OK.`;
}

export function errorMessage(filePath: string, rule: string) {
  return `File ${basename(filePath)} has wrong tokens. (rule: ${rule})`;
}

export function assertTokenUsage(file: string, fileContent: string): Issue[] {
  const wrongColorUsage = retrieveNonVariableCssTokens(fileContent);
  if (wrongColorUsage.length) {
    return wrongColorUsage.map(rule => {
      const startLine: null | number = findLineNumberInText(
        fileContent,
        `rule`,
      );
      return {
        severity: 'error',
        message: errorMessage(file, rule),
        source: {
          file: toUnixPath(file, { toRelative: true }),
          ...(startLine == null ? {} : { position: { startLine } }),
        },
      };
    });
  }
  return [
    {
      message: infoMessage(file),
      severity: 'info',
      source: {
        file: toUnixPath(file, { toRelative: true }),
      },
    },
  ];
}

export default create;
