import { basename } from 'node:path';
import {
  AuditOutput,
  AuditOutputs,
  CategoryRef,
  Issue,
  PluginConfig,
} from '@code-pushup/models';
import { readTextFile } from '@code-pushup/utils';
import {
  crawlFileSystem,
  factorOf,
  pluralizeToken,
  toUnixPath,
} from '../../../../../dist/packages/utils';
import {
  angularComponentRegex,
  angularComponentSelectorRegex,
  getCssVariableUsage,
  loadComponentStyles,
  loadGeneratedStylesFromImports,
} from './utils';

export type PluginOptions = {
  directory: string;
  variableImportPattern: string;
};

type RunnerOptions = PluginOptions;

export const pluginSlug = 'angular-ds';

const angularDsAuditSlug = 'angular-ds-component-styles';
export const auditsMap = {
  [angularDsAuditSlug]: {
    slug: angularDsAuditSlug,
    title: 'Component Styles Audit',
    description: 'An audit to check style usage in a Angular project.',
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
  return `${pluralizeToken('component', numberOfFiles)}`;
}

export function angularDsComponentStylesIssues(options: {
  directory: string;
  variableImportPattern: string;
}): Promise<Issue[]> {
  const { directory, variableImportPattern } = options;

  return (
    crawlFileSystem({
      directory,
      // @TODO also scan inline styles
      // @TODO also only scan files linked to components
      pattern: /.(ts)$/,
      fileTransform: async (filePath: string) => {
        const componentContent = await readTextFile(filePath);
        // Only process files with Angular components inside. Filter out later.
        // @TODO implement pattern matching for file content to filter out interesting files and avoid a second apply of filter later. See: https://github.com/code-pushup/cli/issues/350
        const isComponentFile = Boolean(
          componentContent.match(angularComponentRegex),
        );
        if (!isComponentFile) {
          return false;
        }
        const selector =
          componentContent.match(angularComponentSelectorRegex)?.[3] || false;
        if (!selector) {
          throw new Error('Component without selector is not supported');
        }

        const componentStyles = await loadComponentStyles(componentContent);

        return assertComponentStyles(
          filePath,
          selector,
          componentStyles,
          variableImportPattern,
        );
      },
    })
      // remove after https://github.com/code-pushup/cli/issues/350
      .then(arr => arr.filter((v): v is Issue => !!v))
  );
}

export function infoMessage(filePath: string, selector: string) {
  return `${selector} in file ${basename(
    filePath,
  )} uses design system tokens in styles`;
}

export function errorMessageNoUsageOfVariables(
  filePath: string,
  selector: string,
) {
  return `${selector} in file ${filePath} does not use design system tokens in styles`;
}

export function errorMessageMissingVariableUsage(
  filePath: string,
  selector: string,
  unusedVariables: string[],
) {
  return `${selector} in file ${filePath} has missing variables: ${unusedVariables.join(
    ', ',
  )}`;
}

export async function assertComponentStyles(
  file: string,
  selector: string,
  stylesContent: string,
  variableImportPattern: string,
): Promise<Issue> {
  // informative issue (component styles are OK)
  const issue = {
    source: {
      file: toUnixPath(file, { toRelative: true }),
    },
  } satisfies Pick<Issue, 'source'>;

  // no usage of generated styles
  if (!stylesContent.includes(variableImportPattern)) {
    return {
      ...issue,
      severity: 'error',
      message: errorMessageNoUsageOfVariables(file, selector),
    } satisfies Issue;
  }

  const variablesContent = await loadGeneratedStylesFromImports(
    stylesContent,
    variableImportPattern,
  );
  const { unused } = getCssVariableUsage(variablesContent, stylesContent);

  // missing variables in styles
  if (unused.length) {
    return {
      ...issue,
      severity: 'error',
      message: errorMessageMissingVariableUsage(file, selector, unused),
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
