import {AuditOutput, AuditOutputs, CategoryRef, Issue, PluginConfig,} from '@code-pushup/models';
import {pluralizeToken,} from '@code-pushup/utils';
import {KnipConfig, main} from "knip";
import {CommandLineOptions} from "knip/dist/types/cli";
import {Issues as _Issues, IssueSet} from "knip/dist/types/issues";

type Issues = Omit<_Issues, 'files'> & {file: string};

type ResolvedReturnType<T> = T extends (...args: any[]) => Promise<infer R> ? R : T;

// Using it with main
type KinpReport = ResolvedReturnType<typeof main>;


export type PluginOptions = KnipConfig;

type RunnerOptions = CommandLineOptions;

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
  ({slug}) => ({
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

  const kinpReport = await main(options);

  return knipIssuesToAuditOutputs(kinpReport.issues)
}

export function knipIssuesToAuditOutputs(issues: KinpReport['issues']): AuditOutputs {
  /*
  Transform a dict of audit issues from knip into AuditOutputs

  dependencies: IssueRecords;
    devDependencies: IssueRecords;
    optionalPeerDependencies: IssueRecords;
    unlisted: IssueRecords;
    binaries: IssueRecords;
    unresolved: IssueRecords;
    exports: IssueRecords;
    types: IssueRecords;
    nsExports: IssueRecords;
    nsTypes: IssueRecords;
    duplicates: IssueRecords;
    enumMembers: IssueRecords;
    classMembers: IssueRecords;
   */


  return Object.entries(issues).reduce(([auditKey, issues]) => {

    return ({
      slug: `knip-${auditKey}`,
      score: 0,
      value: 0,
      displayValue: '0',
      details: {
        issues: Array.from(_).map((u) => ({}))
      }
    })
  }, {});
}

function isKey<T extends object>(
  x: T,
  k: PropertyKey
): k is keyof T {
  return k in x;
}
/*
function isIssueSet<T = IssueSet | IssueRecords>(
  set: T,
): set is IssueSet {
  return set instanceof Set
}

function isIssueRecords<T = IssueSet | IssueRecords>(
  set: T,
): set is IssueRecords {
  return set instanceof object
}
*/
export function toAuditOutputs({files, issues}: { files: IssueSet, issues: Issues[] }): AuditOutputs {
  // eslint-disable-next-line functional/no-let
  let auditMap: Record<string, AuditOutput> = {};

  if (files.size > 0) {
    auditMap = {
      ...auditMap,
      files: {
        slug: 'unused-files',
        score: files.size === 0 ? 1 : 0,
        displayValue: `${files.size} unused files`,
        value: files.size,
        details: {
          issues: [...files].map(file => ({
            message: `File ${file} unused`,
            severity: 'warning',
            source: {
              file
            }
          }))
        }
      }
    }
  }

  issues.map(({file, ...auditMap}) => {
    return Object.entries(auditMap).map(([key, s]) => {

    })
  })

  /*for (const [reportType, isReportType] of Object.entries(files)) {
    if (isReportType && isKey(issues, reportType)) {
      let issuesForType: string[];

      const z = issues[reportType];
      if(isIssueSet(z)) {
        issuesForType = Array.from(z);
      } else if (isIssueRecords(z)) {
        issuesForType = Object.values(z).flatMap((d) => Object.values(d).pop().type);
      } else {
        issuesForType = [];
      }

      if (issuesForType.length > 0) {
        auditMap[reportType] = issuesForType;
      }
    }
  }*/

  return Object.values(auditMap);
}

export function displayValue(numberOfFiles: number): string {
  return `${pluralizeToken('file', numberOfFiles)} oversize`;
}

export default create;
