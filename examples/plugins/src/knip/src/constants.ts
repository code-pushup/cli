import { Audit } from '@code-pushup/models';

export const DEFAULT_KNIP_CONFIG = {
  isDebug: false,
  isTrace: false,
  isHelp: false,
  maxIssues: '0',
  noConfigHints: false,
  noExitCode: false,
  gitIgnore: false,
  isShowProgress: false,
  isIncludeEntryExports: false,
  isIsolateWorkspaces: false,
  isObservePerf: false,
  isProduction: false,
  reporterOptions: '',
  preprocessorOptions: '',
  isStrict: false,
  isFix: false,
  fixTypes: [],
  tsConfig: '',
  isVersion: true,
  tags: [],
};
export const AUDITS: Audit[] = [
  {
    slug: 'files',
    title: 'Unused Files',
    description: 'Unable to find a reference to this file',
  },
  {
    slug: 'dependencies',
    title: 'Unused Dependencies',
    description: 'Unable to find a reference to this dependency',
  },
  {
    slug: 'devdependencies',
    title: 'Unused Development Dependencies',
    description: 'Unable to find a reference to this devDependency',
  },
  {
    slug: 'optionalpeerdependencies',
    title: 'Referenced optional peerDependencies',
    description: 'Optional peer dependency is referenced',
  },
  {
    slug: 'unlisted',
    title: 'Unlisted dependencies',
    description: 'Used dependencies not listed in package.json',
  },
  {
    slug: 'binaries',
    title: 'Unlisted binaries',
    description: 'Binaries from dependencies not listed in package.json',
  },
  {
    slug: 'unresolved',
    title: 'Unresolved imports',
    description: 'Unable to resolve this (import) specifier',
  },
  {
    slug: 'exports',
    title: 'Unused exports',
    description: 'Unable to find a reference to this export',
  },
  {
    slug: 'types',
    title: 'Unused exported types',
    description: 'Unable to find a reference to this exported type',
  },
  {
    slug: 'nsexports',
    title: 'Exports in used namespace',
    description: 'Namespace with export is referenced, but not export itself',
  },
  {
    slug: 'nstypes',
    title: 'Exported types in used namespace',
    description: 'Namespace with type is referenced, but not type itself',
  },
  {
    slug: 'enummembers',
    title: 'Unused exported enum members',
    description: 'Unable to find a reference to this enum member',
  },
  {
    slug: 'classmembers',
    title: 'Unused exported class members',
    description: 'Unable to find a reference to this class member',
  },
  {
    slug: 'duplicates',
    title: 'Duplicate exports',
    description: 'This is exported more than once',
  },
].map(audit => ({
  ...audit,
  docsUrl: 'https://knip.dev/reference/issue-types',
}));
