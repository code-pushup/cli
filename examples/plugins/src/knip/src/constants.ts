import { Audit, Group } from '@code-pushup/models';

export const KNIP_PLUGIN_SLUG = 'knip';

const audits = ([
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
    slug: 'duplicates' ,
    title: 'Duplicate exports',
    description: 'This is exported more than once',
  },
] as const satisfies Audit[] ) // we use `as const satisfies` to get strict slug typing

export type KnipAudits = typeof audits[number]['slug'];

function docsLink(slug: KnipAudits): string {
  let anchor = '#';
  const base = 'https://knip.dev/guides/handling-issues';

  switch(slug) {
    case 'files':
      anchor = '#unused-files';
      break;
    case 'dependencies':
    case 'devdependencies':
      anchor = '#unused-dependencies';
      break;
    case 'unlisted':
      anchor = '#unlisted-dependencies';
      break;
    case 'optionalpeerdependencies':
      anchor = '#referenced-optional-peerDependencies';
      break;
    case 'unresolved':
      anchor = '#unresolved-imports';
      break;
    case 'exports':
    case 'types':
    case 'nsexports':
    case 'nstypes':
      anchor = '#unused-exports';
      break;
    case 'enummembers':
      anchor = '#enum-members';
      break;
    case 'classmembers':
      anchor = '#class-members';
      break;
    case 'binaries':
    case 'duplicates':
    default:
      return base;
  }

  return `${base}${anchor}`;
}


export const KNIP_AUDITS = audits.map(audit => ({
  ...audit,
  docsUrl: docsLink(audit.slug),
}));

export const KNIP_GROUP_FILES = {
  slug: 'files',
  title: 'All file audits',
  description: 'Groups all file related audits',
  refs: [
    { slug: 'files', weight: 1 },
  ],
} as const satisfies Group;

export const KNIP_GROUP_DEPENDENCIES = {
  slug: 'dependencies',
  title: 'All dependency audits',
  description: 'Groups all dependency related audits',
  refs: [
    { slug: 'dependencies', weight: 1 },
    { slug: 'devdependencies', weight: 1 },
    { slug: 'binaries', weight: 1 },
    // critical as potentially breaking
    { slug: 'optionalpeerdependencies', weight: 2 },
    { slug: 'unlisted', weight: 2 },
  ],
} as const satisfies Group;

export const KNIP_GROUP_EXPORTS = {
  slug: 'exports',
  title: 'All exports related audits',
  description: 'Groups all dependency related knip audits',
  refs: [
    { slug: 'unresolved', weight: 10 },
    { slug: 'exports', weight: 10 },
    { slug: 'types', weight: 10 },
    { slug: 'nsexports', weight: 10 },
    { slug: 'nstypes', weight: 10 },
    { slug: 'enummembers', weight: 10 },
    { slug: 'classmembers', weight: 10 },
    // eslint-disable-next-line no-magic-numbers
    { slug: 'duplicates', weight: 2 },
  ],
}  as const satisfies Group;

export const KNIP_GROUP_ALL = {
  slug: 'all',
  title: 'All knip audits',
  description: 'Groups all knip audits into a group for easy use',
  refs: [
    ...KNIP_GROUP_FILES.refs,
    ...KNIP_GROUP_EXPORTS.refs,
    ...KNIP_GROUP_DEPENDENCIES.refs,
  ],
} as const satisfies Group;

export const KNIP_GROUPS = ([
  KNIP_GROUP_FILES,
  KNIP_GROUP_EXPORTS,
  KNIP_GROUP_DEPENDENCIES,
  KNIP_GROUP_ALL
] as const satisfies Group[]) // we use `as const satisfies` to get strict slug typing;

export type KnipGroups = typeof KNIP_GROUPS[number]['slug'];
