import { execFileSync, execSync } from 'node:child_process';
import { join } from 'node:path';
import { objectToCliArgs } from '../../../packages/utils/src';
import { BUMP_SCRIPT } from './constants';

export type PublishOptions = {
  registry?: string;
  tag?: string;
  nextVersion: string;
};

export function nxRunManyPublish({
  registry,
  tag = 'e2e',
  nextVersion,
}: PublishOptions) {
  console.info(`Publish packages to registry: ${registry}.`);

  execFileSync(
    'npx',
    [
      'nx',
      'run-many',
      '--targets=publish',
      '--',
      ...(nextVersion ? [`--nextVersion=${nextVersion}`] : []),
      ...(tag ? [`--tag=${tag}`] : []),
      ...(registry ? [`--registry=${registry}`] : []),
    ],
    { env: process.env, stdio: 'inherit', shell: true },
  );
}

export function findLatestVersion(): string {
  const version = execSync('git describe --tags --abbrev=0')
    .toString()
    .trim()
    .replace(/^v/, '');
  console.info(`Version from "git describe --tags --abbrev=0": ${version}`);
  return version;
}

export function bumpVersion({
  nextVersion,
  cwd,
}: {
  nextVersion: string;
  cwd: string;
}): void {
  try {
    execSync(
      `tsx ${join(process.cwd(), BUMP_SCRIPT)} ${objectToCliArgs({
        nextVersion,
      })}`,
      { cwd },
    );
  } catch (error) {
    console.error('Error pumping package version.');
    throw error;
  }
}
