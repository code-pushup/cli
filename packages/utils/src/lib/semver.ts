import { compare, validate } from 'compare-versions';

export function normalizeSemver(semverString: string): string {
  if (semverString.startsWith('v') || semverString.startsWith('V')) {
    return semverString.slice(1);
  }

  if (semverString.includes('@')) {
    return semverString.split('@').at(-1) ?? '';
  }

  return semverString;
}

export function isSemver(semverString: string): boolean {
  return validate(normalizeSemver(semverString));
}

export function sortSemvers(semverStrings: string[]): string[] {
  return semverStrings
    .filter(Boolean)
    .filter(isSemver)
    .sort((a, b) =>
      compare(normalizeSemver(a), normalizeSemver(b), '<=') ? -1 : 0,
    )
    .reverse();
}
