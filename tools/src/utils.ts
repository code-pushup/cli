import { TargetConfiguration } from '@nx/devkit';

export function someTargetsPresent(
  targets: Record<string, TargetConfiguration>,
  targetNames: string | string[],
): boolean {
  const searchTargets = Array.isArray(targetNames)
    ? targetNames
    : [targetNames];
  return Object.keys(targets).some(target => searchTargets.includes(target));
}
