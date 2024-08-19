export type NpmCheckToken = 'FOUND' | `NOT_FOUND`;
export type NpmCheckResult = `${string}#${NpmCheckToken}`;
export type NpmCheckOptions = {
  pkgRange: string;
  registry: string;
  verbose: boolean;
};
