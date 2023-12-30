import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
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
    description: 'An audit to check style usage in a Angular projcet.',
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
    // @TODO  also scan inline styles
    // @TODO also only scan files linked to components
    pattern: /.(scss|css)$/,
    // @TODO implement pattern matching for file content to filter out interesting files to avoid a seconf apply of filter later
    // See: https://github.com/code-pushup/cli/issues/350
    fileTransform: async (file: string) => {
      const filePath = join(directory, file);
      const stylesContent = await readFile(filePath, { encoding: 'utf8' });
      // exclude from checks
      /* if(!stylesContent.includes('/generated/styles/components')) {
        return false;
      }*/
      return assertComponentStyles(file, 'selector', stylesContent);
    },
  });
  // filter out false => files not containing imports
  // remove after https://github.com/code-pushup/cli/issues/350 is implemented
  //  .then(arr => arr.filter((v): v is Issue => !!v));
}

export function infoMessage(filePath: string, selector: string) {
  return `${selector} in file ${basename(
    filePath,
  )} uses design system tokens in styles`;
}

export function errorMessage(filePath: string, selector: string) {
  return `⚠️ ${selector} in file ${filePath} does not use design system tokens in styles`;
}

export function assertComponentStyles(
  file: string,
  selector: string,
  stylesContent: string,
): Issue {
  // informative issue (component styles are OK)
  const issue = {
    source: {
      file: toUnixPath(file, { toRelative: true }),
    },
  } satisfies Pick<Issue, 'source'>;

  // no usage of generated styles
  // @TODO make import path configurable in options
  if (!stylesContent.includes('generated/styles/components')) {
    return {
      ...issue,
      severity: 'error',
      message: errorMessage(file, selector),
    } satisfies Issue;
  }

  // return informative Issue
  return {
    ...issue,
    severity: 'info',
    message: infoMessage(file, selector),
  } satisfies Issue;
}

export default create;
