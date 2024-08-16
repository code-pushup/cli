import { execFileSync, execSync } from 'node:child_process';

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
