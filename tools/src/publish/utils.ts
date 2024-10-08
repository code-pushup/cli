import { execFileSync, execSync } from 'node:child_process';
import { join } from 'node:path';
import { objectToCliArgs } from '../../../packages/utils/src';
import { BUMP_SCRIPT } from './constants';
import type { PublishOptions } from './types';

export function nxRunManyPublish({
  registry,
  tag = 'e2e',
  nextVersion,
  userconfig,
  parallel,
}: PublishOptions) {
  console.info(`Publish packages to registry: ${registry}.`);
  try {
    execFileSync(
      'npx',
      [
        'nx',
        'run-many',
        '--targets=publish',
        ...(parallel ? [`--parallel=${parallel}`] : []),
        '--',
        ...(nextVersion ? [`--nextVersion=${nextVersion}`] : []),
        ...(tag ? [`--tag=${tag}`] : []),
        ...(registry ? [`--registry=${registry}`] : []),
        ...(userconfig ? [`--userconfig=${userconfig}`] : []),
      ],
      { env: process.env, stdio: 'inherit', shell: true },
    );
  } catch (error) {
    console.error('Error publishing packages:\n' + error.message);
    throw error;
  }
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
}) {
  try {
    return execSync(
      `tsx ${join(process.cwd(), BUMP_SCRIPT)} ${objectToCliArgs({
        nextVersion,
      }).join(' ')}`,
      { cwd },
    ).toString();
  } catch (error) {
    console.error('Error bumping package version.');
    throw error;
  }
}

export function nxBumpVersion({
  projectName,
  nextVersion,
  directory,
}: {
  projectName: string;
  nextVersion: string;
  directory: string;
}) {
  try {
    execSync(
      `nx bump-version ${objectToCliArgs({
        _: projectName,
        nextVersion,
        directory,
      }).join(' ')}`,
      {},
    ).toString();
  } catch (error) {
    console.error('Error Nx bump-version target failed.');
    throw error;
  }
}
