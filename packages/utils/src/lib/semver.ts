import { rcompare, valid } from 'semver';

export function normalizeSemver(semverString: string): string {
  if (semverString.startsWith('v') || semverString.startsWith('V')) {
    return semverString.slice(1);
  }

  if (semverString.includes('@')) {
    return semverString.split('@').at(-1) ?? '';
  }

  return semverString;
}

export function isSemver(semverString = ''): boolean {
  return valid(normalizeSemver(semverString)) != null;
}

export function sortSemvers(semverStrings: string[]): string[] {
  return semverStrings.map(normalizeSemver).filter(isSemver).sort(rcompare);
}
