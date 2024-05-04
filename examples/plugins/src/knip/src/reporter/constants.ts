import { IssueType } from 'knip/dist/types/issues';

export const ISSUE_TYPES = [
  'files',
  'dependencies',
  'devDependencies',
  'optionalPeerDependencies',
  'unlisted',
  'binaries',
  'unresolved',
  'exports',
  'nsExports',
  'types',
  'nsTypes',
  'enumMembers',
  'classMembers',
  'duplicates',
] as const;

export const ISSUE_TYPE_TITLE: Record<IssueType | '_files', string> = {
  files: 'Unused files',
  _files: 'Unused files',
  dependencies: 'Unused dependencies',
  devDependencies: 'Unused devDependencies',
  optionalPeerDependencies: 'Referenced optional peerDependencies',
  unlisted: 'Unlisted dependencies',
  binaries: 'Unlisted binaries',
  unresolved: 'Unresolved imports',
  exports: 'Unused exports',
  nsExports: 'Exports in used namespace',
  types: 'Unused exported types',
  nsTypes: 'Exported types in used namespace',
  enumMembers: 'Unused exported enum members',
  classMembers: 'Unused exported class members',
  duplicates: 'Duplicate exports',
} as const;

export const ISSUE_TYPE_MESSAGE: Record<
  IssueType | '_files',
  (arg: string) => string
> = {
  files: (file: string) => `Unused file ${file}`,
  // eslint-disable-next-line  @typescript-eslint/naming-convention
  _files: (file: string) => `Unused file ${file}`,
  dependencies: (dep: string) => `Unused dependency ${dep}`,
  devDependencies: (dep: string) => `Unused devDependency ${dep}`,
  optionalPeerDependencies: (dep: string) =>
    `Referenced optional peerDependency ${dep}`,
  unlisted: (dep: string) => `Unlisted dependency ${dep}`,
  binaries: (binary: string) => `Unlisted binary ${binary}`,
  unresolved: (importName: string) => `Unresolved import ${importName}`,
  exports: (exportName: string) => `Unused export ${exportName}`,
  nsExports: (namespace: string) => `Exports in used namespace ${namespace}`,
  types: (type: string) => `Unused exported type ${type}`,
  nsTypes: (namespace: string) =>
    `Exported types in used namespace ${namespace}`,
  enumMembers: (enumMember: string) =>
    `Unused exported enum member ${enumMember}`,
  classMembers: (classMember: string) =>
    `Unused exported class member ${classMember}`,
  duplicates: (duplicate: string) => `Duplicate export ${duplicate}`,
} as const;
