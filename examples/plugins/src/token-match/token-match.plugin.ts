import {readFile} from 'node:fs/promises';
import {AuditOutput, AuditOutputs, CategoryRef, Issue, PluginConfig,} from '@code-pushup/models';
import {crawlFileSystem, factorOf, pluralizeToken, toUnixPath,findLineNumberInText} from '../../../../dist/packages/utils';

export type PluginOptions = {
  directory: string;
  pattern: string | RegExp;
};

type RunnerOptions = PluginOptions;

export const pluginSlug = 'token-match';

const tokenMatchAuditSlug = 'token-match-audit';
export const auditsMap = {
  [tokenMatchAuditSlug]: {
    slug: tokenMatchAuditSlug,
    title: 'Token Match Audit',
    description: 'An audit to check JavaScript file size in a directory.',
  },
};
export const audits = Object.values(auditsMap);

export const recommendedRefs: CategoryRef[] = Object.values(auditsMap).map(
  ({slug}) => ({
    type: 'audit',
    plugin: pluginSlug,
    slug,
    weight: 1,
  }),
);

export function create(options: PluginOptions): PluginConfig {
  return {
    slug: pluginSlug,
    title: 'Token Match',
    icon: 'javascript',
    runner: () => runnerFunction(options),
    audits,
  };
}

export async function runnerFunction(
  options: RunnerOptions,
): Promise<AuditOutputs> {
  const tokenMatchAuditOutput: AuditOutput = {
    slug: tokenMatchAuditSlug,
    score: 1,
    value: 0,
    displayValue: pluralizeToken('file'),
  };

  return [
    {
      ...tokenMatchAuditOutput
    },
  ];
}

/*
function filterSeverityError(issue: Issue): issue is Issue {
  return issue.severity === 'error';
}

export function tokenIssue(
  file: string,
  content: string,
  token: string | RegExp
): Issue {

  const source: Issue['source'] = {
    file: toUnixPath(file),
  }

  const lineStart = findLineNumberInText(content, token);
  if (lineStart != null) {
      return {
        ...source,
        severity: 'error',
        message: `File contains token ${token}.`,
      } satisfies Issue;
  }

  return {
    ...source,
    severity: 'info',
    message: `File does not contain token ${token}.`,
  } satisfies Issue;
}
*/
