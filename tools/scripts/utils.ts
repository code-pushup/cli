import { execFileSync } from 'child_process';
import {
  ChildProcess,
  SpawnOptions,
  execSync,
  spawn,
} from 'node:child_process';
import {
  NpmInstallOptions,
  NpmUninstallOptions,
  PublishOptions,
  RegistryData,
  RegistryResult,
} from './types';

export function configureRegistry({
  host,
  registry,
  registryNoProtocol,
}: RegistryData) {
  /**
   * TODO
   */
  // npm
  process.env.npm_config_registry = registry;
  // yarnv1
  process.env.YARN_REGISTRY = registry;
  // yarnv2
  process.env.YARN_NPM_REGISTRY_SERVER = registry;
  console.info(`Set NPM and yarn registry process.env`);
  /**
   * TODO
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

export function findLatestVersion(): string {
  const version = execSync('git describe --tags --abbrev=0')
    .toString()
    .trim()
    .replace(/^v/, '');
  console.info(`Version from "git describe --tags --abbrev=0": ${version}`);
  return version;
}

export function parseRegistryData(stdout: string): RegistryData {
  const port = parseInt(
    stdout.toString().match(/localhost:(?<port>\d+)/)?.groups?.port,
  );
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
  //const protocol = 'http';
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

export type ProcessResult = {
  stdout: string;
  stderr: string;
  code: number | null;
  date: string;
  duration: number;
};

export class ProcessError extends Error {
  code: number | null;
  stderr: string;
  stdout: string;

  constructor(result: ProcessResult) {
    super(result.stderr);
    this.code = result.code;
    this.stderr = result.stderr;
    this.stdout = result.stdout;
  }
}

export type ProcessConfig = {
  command: string;
  args?: string[];
  options: SpawnOptions;
  observer?: ProcessObserver;
  ignoreExitCode?: boolean;
};

export type ProcessObserver = {
  onStdout?: (stdout: string, childProcess: ChildProcess) => void;
  onStderr?: (stdout: string, childProcess: ChildProcess) => void;
  onError?: (error: ProcessError) => void;
  onComplete?: (code?: number) => void;
};

export function executeProcess(cfg: ProcessConfig): Promise<ProcessResult> {
  const date = new Date().toISOString();
  const start = performance.now();

  const { observer, options, command, args, ignoreExitCode = false } = cfg;
  const { onStdout, onStderr, onError, onComplete } = observer ?? {};

  return new Promise((resolve, reject) => {
    // shell:true tells Windows to use shell command for spawning a child process
    const process = spawn(command, args, { shell: true, ...options });
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', data => {
      stdout += String(data);
      onStdout?.(String(data), process);
    });

    process.stderr.on('data', data => {
      stderr += String(data);
      onStderr?.(String(data), process);
    });

    process.on('error', err => {
      stderr += err.toString();
    });

    process.on('close', code => {
      const timings = { date, duration: start - performance.now() };
      if (code === 0 || ignoreExitCode) {
        onComplete?.(code);
        resolve({ code, stdout, stderr, ...timings });
      } else {
        const errorMsg = new ProcessError({ code, stdout, stderr, ...timings });
        onError?.(errorMsg);
        reject(errorMsg);
      }
    });
  });
}

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

export function nxRunManyNpmInstall({
  registry,
  tag = 'e2e',
  pkgVersion,
}: NpmInstallOptions) {
  console.info(`Installing packages from registry: ${registry}.`);

  execFileSync(
    'npx',
    [
      'nx',
      'run-many',
      '--targets=npm-install',
      '--parallel=1',
      '--',
      ...(pkgVersion ? [`--nextVersion=${pkgVersion}`] : []),
      ...(tag ? [`--tag=${tag}`] : []),
      ...(registry ? [`--registry=${registry}`] : []),
    ],
    { env: process.env, stdio: 'inherit', shell: true },
  );
}

export function nxRunManyNpmUninstall() {
  console.info('Uninstalling all NPM packages.');
  try {
    execFileSync(
      'npx',
      ['nx', 'run-many', '--targets=npm-uninstall', '--parallel=1'],
      { env: process.env, stdio: 'inherit', shell: true },
    );
  } catch (error) {
    console.error('Uninstalling all NPM packages failed.');
  }
}
