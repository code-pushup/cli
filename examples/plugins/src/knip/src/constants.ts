import { Audit, CategoryRef, Group } from '@code-pushup/models';

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

export const GROUP_DEPENDENCIES: Group = {
  slug: 'all-dependencies',
  title: 'All dependency audits',
  description: 'Groups all dependency related knip audits',
  refs: [
    { slug: 'dependencies', weight: 1 },
    { slug: 'devdependencies', weight: 1 },
    { slug: 'optionalpeerdependencies', weight: 1 },
  ],
};

export const GROUP_ALL: Group = {
  slug: 'all-audits',
  title: 'All knip audits',
  description: 'Groups all knip audits into a group for easy use',
  refs: [
    { slug: 'files', weight: 1 },
    { slug: 'dependencies', weight: 1 },
    { slug: 'devdependencies', weight: 1 },
    { slug: 'optionalpeerdependencies', weight: 1 },
    { slug: 'unlisted', weight: 1 },
    { slug: 'binaries', weight: 1 },
    { slug: 'unresolved', weight: 1 },
    { slug: 'exports', weight: 1 },
    { slug: 'types', weight: 1 },
    { slug: 'nsexports', weight: 1 },
    { slug: 'nstypes', weight: 1 },
    { slug: 'enummembers', weight: 1 },
    { slug: 'classmembers', weight: 1 },
    { slug: 'duplicates', weight: 1 },
  ],
};

export const CATEGORY_REFS: CategoryRef[] = AUDITS.map(({ slug }) => ({
  plugin: 'knip',
  slug,
  type: 'audit',
  weight: 1,
}));
