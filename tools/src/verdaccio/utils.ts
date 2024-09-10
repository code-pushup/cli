import { execSync } from 'node:child_process';
import { Registry, RegistryServer } from './registry';

export function uniquePort(): number {
  return Number((6000 + Number(Math.random() * 1000)).toFixed(0));
}

export function configureRegistry({ host, url, urlNoProtocol }: Registry) {
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
  process.env.npm_config_registry = url;
  process.env.YARN_REGISTRY = url;
  process.env.YARN_NPM_REGISTRY_SERVER = url;
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
  execSync(
    `npm config set ${urlNoProtocol}/:_authToken "${token}" --userconfig .npmrc`,
  );
  console.info(`_authToken for ${url} set to ${token} in .npmrc`);
}

export function unconfigureRegistry({
  urlNoProtocol,
}: Pick<Registry, 'urlNoProtocol'>) {
  execSync(
    `npm config delete ${urlNoProtocol}/:_authToken --userconfig .npmrc`,
  );
  console.info(`delete npm authToken: ${urlNoProtocol} form .npmrc`);
}

export function parseRegistryData(stdout: string): RegistryServer {
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
  const urlNoProtocol = `//${host}:${port}`;
  const url = `${protocol}:${urlNoProtocol}`;

  return {
    protocol,
    host,
    port,
    urlNoProtocol,
    url,
  };
}
