import {Audit} from "@code-pushup/models";

export const DEFAULT_KNIP_CONFIG = {
  isDebug: false,
  isTrace: false,
  isHelp: false,
  maxIssues: '0',
  noConfigHints: false,
  noExitCode: false,
  gitIgnore: false,
  isShowProgress: false,
  isIncludeEntryExports : false,
  isIsolateWorkspaces : false,
  isObservePerf : false,
   isProduction : false,
  reporterOptions: '',
  preprocessorOptions: '',
  isStrict: false,
  isFix : false,
  fixTypes: [],
  tsConfig: '',
  isVersion: true,
  tags: []
};
export const AUDITS: Audit[] = [
  {
    slug: 'unused-files',
    title: 'Unused Files',
    description: "Unable to find a reference to this file",
  },
  {
    slug: 'unused-dependencies',
    title: 'Unused Dependencies',
    description: "Unable to find a reference to this dependency",
  },
  {
    slug: 'unused-dev-dependencies',
    title: 'Unused Development Dependencies',
    description: "Unable to find a reference to this devDependency",
  },
  {
    slug: 'referenced-optional-peer-dependencies',
    title: 'Referenced optional peerDependencies',
    description: "Optional peer dependency is referenced",
  },
  {
    slug: 'unlisted-dependencies',
    title: 'Unlisted dependencies',
    description: "Used dependencies not listed in package.json",
  },
  {
    slug: 'unlisted-binaries',
    title: 'Unlisted binaries',
    description: "Binaries from dependencies not listed in package.json",
  },
  {
    slug: 'unresolved-imports',
    title: 'Unresolved imports',
    description: "Unable to resolve this (import) specifier",
  },
  {
    slug: 'unused-exports',
    title: 'Unused exports',
    description: "Unable to find a reference to this export",
  },
  {
    slug: 'unused-exported-types',
    title: 'Unused exported types',
    description: "Unable to find a reference to this exported type",
  },
  {
    slug: 'exports-in-used-namespace',
    title: 'Exports in used namespace',
    description: "Namespace with export is referenced, but not export itself",
  },
  {
    slug: 'exported-types-in-used-namespace',
    title: 'Exported types in used namespace',
    description: "Namespace with type is referenced, but not type itself",
  },
  {
    slug: 'unused-exported-enum-members',
    title: 'Unused exported enum members',
    description: "Unable to find a reference to this enum member",
  },
  {
    slug: 'unused-exported-class-members',
    title: 'Unused exported class members',
    description: "Unable to find a reference to this class member",
  },
  {
    slug: 'duplicate-exports',
    title: 'Duplicate exports',
    description: "This is exported more than once",
  }
].map((audit) => ({...audit, docsUrl: "https://knip.dev/reference/issue-types"}))
