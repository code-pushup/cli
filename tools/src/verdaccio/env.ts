import { bold, gray, red } from 'ansis';
// eslint-disable-next-line n/no-sync
import { execFileSync, execSync } from 'node:child_process';
import { join } from 'node:path';
// can't import from utils
import { objectToCliArgs } from '../../../packages/nx-plugin/src';
import {
  setupTestFolder,
  teardownTestFolder,
} from '../../../testing/test-setup/src';
import { ensureDirectoryExists } from '../../../testing/test-utils/src';
import {
  NxStarVerdaccioOptions,
  Registry,
  nxStartVerdaccioServer,
} from './registry';

export function projectE2eScope(projectName: string): string {
  return join('tmp', 'e2e', projectName);
}

export type VerdaccioEnv = {
  workspaceRoot: string;
  userconfig?: string;
};

export function configureRegistry(
  {
    url,
    urlNoProtocol,
    userconfig,
  }: Registry & Pick<VerdaccioEnv, 'userconfig'>,
  verbose?: boolean,
) {
  /**
   * Protocol-Agnostic Configuration: The use of // allows NPM to configure authentication for a registry without tying it to a specific protocol (http: or https:).
   * This is particularly useful when the registry might be accessible via both HTTP and HTTPS.
   *
   * Example: //registry.npmjs.org/:_authToken=your-token
   */
  const token = 'secretVerdaccioToken';
  const setAuthToken = `npm config set ${urlNoProtocol}/:_authToken "${token}" ${objectToCliArgs(
    { userconfig },
  ).join(' ')}`;
  if (verbose) {
    console.info(
      `${gray('>')} ${gray(bold('Verdaccio-Env'))} Execute: ${setAuthToken}`,
    );
  }
  execSync(setAuthToken);

  const setRegistry = `npm config set registry="${url}" ${objectToCliArgs({
    userconfig,
  }).join(' ')}`;
  if (verbose) {
    console.info(
      `${gray('>')} ${gray(bold('Verdaccio-Env'))} Execute: ${userconfig}`,
    );
  }
  execSync(setRegistry);
}

export function unconfigureRegistry(
  {
    urlNoProtocol,
    userconfig,
  }: Pick<Registry, 'urlNoProtocol'> & Pick<VerdaccioEnv, 'userconfig'>,
  verbose?: boolean,
) {
  execSync(`npm config delete registry --userconfig ${userconfig}`);
  execSync(
    `npm config delete ${urlNoProtocol}/:_authToken --userconfig ${userconfig}`,
  );
  if (verbose) {
    console.info(
      `${gray('>')} ${gray(
        bold('Verdaccio-Env'),
      )} delete registry from ${userconfig}`,
    );
    console.info(
      `${gray('>')} ${gray(
        bold('Verdaccio-Env'),
      )} delete npm authToken: ${urlNoProtocol} from ${userconfig}`,
    );
  }
}

export async function setupNpmWorkspace(directory: string, verbose?: boolean) {
  if (verbose) {
    console.info(
      `${gray('>')} ${gray(
        bold('Verdaccio-Env'),
      )} Execute: npm init in directory ${directory}`,
    );
  }
  const cwd = process.cwd();
  await ensureDirectoryExists(directory);
  process.chdir(join(cwd, directory));
  try {
    execFileSync('npm', ['init', '--force']).toString();
  } catch (error) {
    console.error(
      `${red('>')} ${red(
        bold('Verdaccio-Env'),
      )} Error creating NPM workspace: ${(error as Error).message}`,
    );
  } finally {
    process.chdir(cwd);
  }
}

export type StartVerdaccioAndSetupEnvOptions = Partial<
  NxStarVerdaccioOptions & VerdaccioEnv
> &
  Pick<NxStarVerdaccioOptions, 'projectName'>;

export type VerdaccioEnvResult = VerdaccioEnv & {
  registry: Registry;
  stop: () => void;
};

export async function nxStartVerdaccioAndSetupEnv({
  projectName,
  port,
  verbose = false,
  workspaceRoot = projectE2eScope(projectName),
  location = 'none',
  // reset or remove cached packages and/or metadata.
  clear = true,
}: StartVerdaccioAndSetupEnvOptions): Promise<VerdaccioEnvResult> {
  // set up NPM workspace environment
  const storage = join(workspaceRoot, 'storage');

  // @TODO potentially done by verdaccio task when clearing storage
  await setupTestFolder(storage);
  const registryResult = await nxStartVerdaccioServer({
    projectName,
    storage,
    port,
    location,
    clear,
    verbose,
  });

  await setupNpmWorkspace(workspaceRoot, verbose);

  const userconfig = join(workspaceRoot, '.npmrc');
  configureRegistry({ ...registryResult.registry, userconfig }, verbose);

  return {
    ...registryResult,
    stop: () => {
      registryResult.stop();
      unconfigureRegistry(registryResult.registry, verbose);
    },
    workspaceRoot,
    userconfig,
  } satisfies VerdaccioEnvResult;
}

export async function nxStopVerdaccioAndTeardownEnv(
  result: VerdaccioEnvResult,
  teardownWorkspaceRoot = true,
  teardownStorage = true,
) {
  if (result) {
    const { stop, registry, workspaceRoot } = result;
    if (stop == null) {
      throw new Error(
        'global e2e teardown script was not able to derive the stop script for the active registry from "activeRegistry"',
      );
    }
    console.info(`Un configure registry: ${registry.url}`);
    if (typeof stop === 'function') {
      stop();
    } else {
      console.error('Stop is not a function. Type:', typeof stop);
    }

    if (teardownWorkspaceRoot) {
      await teardownTestFolder(workspaceRoot);
    } else if (teardownStorage) {
      await teardownTestFolder(result.registry.storage);
    }
  } else {
    throw new Error(`Failed to stop registry.`);
  }
}
