import { execSync } from 'node:child_process';
import { RegistryData } from './types';

export function configureRegistry({
  host,
  registry,
  registryNoProtocol,
}: RegistryData) {
  console.info(`Set NPM registry under location user to ${registry}`);
  execSync(`npm config set registry "${registry}"`);

  console.info(`Set yarn whitelíst process.env`);

  /**
   * Protocol-Agnostic Configuration: The use of // allows NPM to configure authentication for a registry without tying it to a specific protocol (http: or https:).
   * This is particularly useful when the registry might be accessible via both HTTP and HTTPS.
   *
   * Example: //registry.npmjs.org/:_authToken=your-token
   */
  const token = 'secretVerdaccioToken';
  execSync(`npm config set ${registryNoProtocol}/:_authToken "${token}"`);
  console.info(`_authToken for ${registry} set to ${token}`);
}

export function unconfigureRegistry({
  registryNoProtocol,
}: Pick<RegistryData, 'registryNoProtocol'>) {
  execSync('npm config delete registry');
  execSync(`npm config delete ${registryNoProtocol}/:_authToken`);
  console.info('delete npm authToken: ' + registryNoProtocol);
}

export function findLatestVersion(): string {
  return execSync('git describe --tags --abbrev=0')
    .toString()
    .trim()
    .replace(/^v/, '');
}

export function parseRegistryData(stdout: string): RegistryData {
  const port = parseInt(
    stdout.toString().match(/localhost:(?<port>\d+)/)?.groups?.port ?? '',
  );
  if (isNaN(port)) {
    throw new Error('Invalid port number');
  }
  const protocolMatch = stdout
    .toString()
    .match(/(?<proto>https?):\/\/localhost:/);
  const protocol = protocolMatch?.groups?.proto;

  if (!protocol || !['http', 'https'].includes(protocol)) {
    throw new Error(
      `Invalid protocol ${protocol}. Only http and https are allowed.`,
    );
  }

  const host = 'localhost';
  const registryNoProtocol = `//${host}:${port}`;
  const registry = `${protocol}:${registryNoProtocol}`;

  return {
    protocol,
    host,
    port,
    registryNoProtocol,
    registry,
  };
}
