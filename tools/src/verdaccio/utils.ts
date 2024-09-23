import { execSync } from 'node:child_process';
import type { RegistryData } from './start-local-registry';

export function uniquePort(): number {
  return Number((6000 + Number(Math.random() * 1000)).toFixed(0));
}

export function configureRegistry({
  host,
  registry,
  registryNoProtocol,
}: RegistryData) {
  /**
   * Sets environment variables for NPM and Yarn registries, and optionally configures
   * Yarn's unsafe HTTP whitelist.
   *
   * @param {string} registry - The registry URL to set for NPM and Yarn.
   * @param {string} host - The hostname to whitelist for Yarn (optional).
   *
   * Variables Set:
   * - `npm_config_registry`: NPM registry.
   * - `YARN_REGISTRY`: Yarn v1 registry.
   * - `YARN_NPM_REGISTRY_SERVER`: Yarn v2 registry.
   * - `YARN_UNSAFE_HTTP_WHITELIST`: Yarn HTTP whitelist.
   */
  process.env.npm_config_registry = registry;
  process.env.YARN_REGISTRY = registry;
  process.env.YARN_NPM_REGISTRY_SERVER = registry;
  console.info(`Set NPM and yarn registry process.env`);

  /**
   * Optional: Set Yarn HTTP whitelist for non-HTTPS registries.
   */
  process.env.YARN_UNSAFE_HTTP_WHITELIST = host;
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
  execSync(`npm config delete ${registryNoProtocol}/:_authToken`);
  console.info('delete npm authToken: ' + registryNoProtocol);
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
