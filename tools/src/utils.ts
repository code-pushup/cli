import type { TargetConfiguration } from '@nx/devkit';

export function someTargetsPresent(
  targets: Record<string, TargetConfiguration>,
  targetNames: string | string[],
): boolean {
  const searchTargets = Array.isArray(targetNames)
    ? targetNames
    : [targetNames];
  return Object.keys(targets).some(target => searchTargets.includes(target));
}

export function invariant(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

// A simple SemVer validation to validate the version
const validVersion = /^\d+\.\d+\.\d+(-\w+\.\d+)?/;
export function parseVersion(rawVersion: string) {
  if (rawVersion != null && rawVersion !== '') {
    invariant(
      rawVersion && validVersion.test(rawVersion),
      `No version provided or version did not match Semantic Versioning, expected: #.#.#-tag.# or #.#.#, got ${rawVersion}.`,
    );
    return rawVersion;
  } else {
    return undefined;
  }
}
