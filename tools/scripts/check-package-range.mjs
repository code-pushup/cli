import { execFileSync } from 'node:child_process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const { pkgVersion, registry = 'https://registry.npmjs.org/' } = yargs(
  hideBin(process.argv),
)
  .options({
    pkgVersion: { type: 'string', demandOption: true },
    registry: { type: 'string' },
  })
  .coerce('pkgVersion', rawVersion => {
    if (rawVersion != null && rawVersion !== '') {
      return rawVersion;
    } else {
      return undefined;
    }
  })
  .coerce('registry', rawRegistry => {
    if (rawRegistry != null && rawRegistry !== '') {
      return rawRegistry;
    } else {
      return undefined;
    }
  }).argv;

try {
  const viewResult = execFileSync(
    'npm',
    [
      'view',
      pkgVersion,
      registry ? `--registry=${registry}` : '',
      // Hide process output via "2>/dev/null". Otherwise, it will print the error message to the terminal.
      '2>/dev/null',
    ],
    { shell: true },
  ).toString();

  const existingPackage = viewResult
    .split('\n')
    .filter(Boolean)
    .at(0)
    .split(' ')
    .at(0);
  console.warn(`Package ${existingPackage} exists in registry ${registry}.`);
  process.exit(0);
} catch (e) {
  console.error(
    `Package range ${pkgVersion} is not present in registry ${registry}.`,
  );
  process.exit(1);
}
