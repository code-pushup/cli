/**
 * This script starts a local registry for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 */
import { execSync, spawn } from 'node:child_process';
import { join } from 'node:path';
import { releasePublish, releaseVersion } from 'nx/release';

export default async () => {
  // local registry target to run
  const localRegistryTarget = '@code-pushup/cli-source:local-registry';
  // storage folder for the local registry
  const storage = join(
    'tmp',
    'local-registry',
    'storage',
    process.env.NX_TASK_TARGET_PROJECT ?? '',
  );

  // using storage
  const { registry, stop } = await startLocalRegistry({
    localRegistryTarget,
    storage,
    verbose: true,
  });

  if (!registry) {
    console.error('Local registry not started');
    process.exit(1);
  }
  global.stopLocalRegistry = stop;
  global.registry = registry;
  try {
    const version = execSync('git describe --tags --abbrev=0')
      .toString()
      .trim();

    await releaseVersion({
      specifier: version.substring(1),
      stageChanges: false,
      gitCommit: false,
      gitTag: false,
      firstRelease: true,
      generatorOptionsOverrides: {
        skipLockFileUpdate: true,
      },
    });

    await releasePublish({
      tag: 'e2e',
      registry,
    });
    return registry;
  } catch (e) {
    console.error(e);
    global.stopLocalRegistry();
    process.exit(1);
  }
};

// soft copy from https://github.com/nrwl/nx/blob/16.9.x/packages/js/src/plugins/jest/start-local-registry.ts
// original function does not work, because it uses require.resolve('nx') and fork,
// and it does not work with vite
function startLocalRegistry({
  localRegistryTarget,
  storage,
  verbose,
}: {
  localRegistryTarget: string;
  storage?: string;
  verbose?: boolean;
}) {
  if (!localRegistryTarget) {
    throw new Error(`localRegistryTarget is required`);
  }
  return new Promise<{ stop: () => void; registry: string | null }>(
    (resolve, reject) => {
      const childProcess = spawn(
        'npx',
        [
          'nx',
          ...`run ${localRegistryTarget} --location none --clear true`.split(
            ' ',
          ),
          ...(storage ? [`--storage`, storage] : []),
        ],
        { stdio: 'pipe', shell: true },
      );

      const listener = data => {
        if (verbose) {
          process.stdout.write(data);
        }
        if (data.toString().includes('http://localhost:')) {
          const port = parseInt(
            data.toString().match(/localhost:(?<port>\d+)/)?.groups?.port,
          );
          console.info('Local registry started on port ' + port);

          const registry = `http://localhost:${port}`;
          process.env.npm_config_registry = registry;
          execSync(
            `npm config set //localhost:${port}/:_authToken "secretVerdaccioToken"`,
          );

          // yarnv1
          process.env.YARN_REGISTRY = registry;
          // yarnv2
          process.env.YARN_NPM_REGISTRY_SERVER = registry;
          process.env.YARN_UNSAFE_HTTP_WHITELIST = 'localhost';

          console.info('Set npm and yarn config registry to ' + registry);

          resolve({
            registry,
            stop: () => {
              childProcess.kill();
              console.info('Local registry stopped');
              execSync(`npm config delete //localhost:${port}/:_authToken`);
            },
          });
          childProcess?.stdout?.off('data', listener);
        }
      };
      childProcess?.stdout?.on('data', listener);
      childProcess?.stderr?.on('data', data => {
        process.stderr.write(data);
      });
      childProcess.on('error', err => {
        console.error('local registry error', err);
        reject(err);
      });
      childProcess.on('exit', code => {
        console.info('local registry exit', code);
        if (code !== 0) {
          reject(code);
        } else {
          resolve({
            registry: null,
            stop: () => {},
          });
        }
      });
    },
  );
}
