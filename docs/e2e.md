# End-to-end testing

## Publishing (only used for E2E tests with local registry)

> [!NOTE] Projects are marked as publishabel by adding a target named `publishabel`.
> Those libraries will have dynamic targets to publish and install the package.

Every publishable project in the monorepo has the following targets:

- [`publish`](./tools/src/publish/README.md#publish) - publish the package to the local registry
- [`npm-check`](./tools/src/npm/README.md#npm-check) - check if the package is installed in registry
- [`npm-install`](./tools/src/npm/README.md#npm-install) - install package.
- [`npm-uninstall`](./tools/src/npm/README.md#npm-uninstall) - uninstall package form project

The following steps are necessary to publish a package:

1. `nx run <project-name>:npm-check` - check if the package is not already published
2. `nx run <project-name>:publish --nextVersion=<version>` - publish package (login required)
3. `nx run <project-name>:npm-check` - check if the package is published

## E2E testing

> [!NOTE] Projects that need verdaccio are identified over the `e2e` target.
> Those libraries will have dynamic targets to start verdaccio and test the package.

All E2E tests use verdaccio to test the build artefact in a real registry.

Every E2E project in the monorepo has the following targets:

- [`start-verdaccio`](./tools/src/verdaccio/README.md#start-verdaccio) - start a local registry

#### Running E2E tests for a given project:

Every project in the monorepo that has E2E tests follows the project naming pattern: `<project-name>-e2e`.

Examples:

- `npx nx e2e cli-e2e` - run E2E tests for the cli project
- `npx nx e2e cli-e2e --skipNxCache` - pass Nx CLI arguments
- `npx nx run-many -t e2e` - run all E2E tests

### E2E testing process

The `e2e` testing process is complex and involves multiple steps and targets.

#### Overview:

- `nx run e2e <project-name>`
  - `global-setup.e2e.ts#setup` (vitest setup script configured in `vite.config.e2e.ts`)
    - setup - `nx start-verdaccio`
    - setup - `nx run-many -t publish`
    - setup - `nx run-many -t npm-install`
  - **run tests**
  - `global-setup.e2e.ts#teardown` (vitest teardown script configured in `vite.config.e2e.ts`)
    - teardown - `nx run-many -t npm-uninstall`
    - teardown - `process.kill(<verdaccio-port>)`

// mermaid diagram about the process

```mermaid
graph TD
  A[nx run e2e <project-name>] --> B[global-setup.e2e.ts]
  B --> C[nx start-verdaccio]
  C --> D[nx run-many -t publish]
  D --> E[nx run-many -t npm-install]
  E --> F[vitest test]
  F --> G[nx run-many -t npm-uninstall]
  G --> H[process.kill(<verdaccio-port>)]
```

#### Involved files:

```text
Root/
├── e2e/
│   └── <project-name>-e2e/
│       ├── tests/
│       │   └── <file-name>.e2e.ts
│       ├── vite.config.e2e.ts // uses `global-setup.e2e.ts` for as `globalSetup` script
│       └── project.json
├── packages/
│   └── <project-name>/
│       └── package.json // marked as "publishable"
├── .verdaccio/
│   └── config.yaml
├── tools/ // all plugins registered in nx.json
│    └── src/
│       ├── npm/
│       │   └── npm.plugin.ts
│       ├── publish/
│       │    └── publish.plugin.ts
│       └── verdaccio/
│           └── verdaccio.plugin.ts
├── global-setup.e2e.ts
└── nx.json // registers npm, publish and verdaccio plugin
```

#### `nx e2e <project-name>` process:

1. Nx derives all dynamic targets from the plugins registers in `nx.json`.
   The following plugins are registered to publish packages to a local registry:

```jsonc
// nx.json
{
  // ...
  "plugins": ["tools/src/npm/npm.plugin.ts", "tools/src/publish/publish.plugin.ts", "tools/src/verdaccio/verdaccio.plugin.ts"]
}
```

2. The `e2e` target registered in `<project-name>/project.json` is executed:

```jsonc
{
  "targets": {
    // ...
    "e2e": {
      "executor": "@nx/vite:test",
      "options": {
        "configFile": "e2e/<project-name>-e2e/vite.config.e2e.ts"
      }
    }
  }
}
```

2. 1. The `vite.config.e2e.ts` file is used to configure the Vite test runner.
      Inside the file, the `globalSetup` option is set to `global-setup.e2e.ts`:

```typescript
export default defineConfig({
  // ...
  globalSetup: ['../../global-setup.e2e.ts'],
});
```

2. 2. The `global-setup.e2e.ts` file is used to configure the global `setup` scripts for the test runner:
      The `setup` function is executed before the tests are run.
      It starts a local registry, publishes the package, and installs it in the project.

> [!NOTE]  
> ATM the E2E tests install the packages in the workspace root which blocks the parallel execution of E2E tests.

```typescript
// global-setup.e2e.ts

// to avoid port conflicts ever E2E targets has a unique port
const uniquePort = Math.random();
const e2eDir = join('tmp', 'e2e');

export async function setup() {
  // start local verdaccio registry
  const { registry } = await startLocalRegistry({
    localRegistryTarget: '@code-pushup/cli-source:start-verdaccio',
    // to avoid file system conflicts ever E2E targets has a unique storage folder
    storage: join(join(e2eDir, `registry-${uniquePort}`), 'storage'),
    port: uniquePort,
  });

  // package publish & install
  const version = findLatestVersion();
  nxRunManyPublish({ registry, nextVersion: version });
  nxRunManyNpmInstall({ registry, pkgVersion: version });
}
```

3. The tests are executed and import the packages over their package name not over the build output.

```typescript
// correct
import * as packageName from "<package-name>"
// wrong
import * as packageName from "./dist/packages/<project-name>/src/index.js"
```

4. The `global-setup.e2e.ts` file is used to configure the global `teardown` scripts for the test runner:
   The `teardown` function is executed after the tests are run.
   It uninstalls the package and stops the local registry.

```typescript
// global-setup.e2e.ts

export async function teardown() {
  // package uninstall
  nxRunManyNpmUninstall();
  // stop local verdaccio registry
  stopLocalRegistry({ port: uniquePort });
}
```

#### Changes/generated files during e2e tests:

```text
Root/
├── dist/
│   └── packages/
│       └── <project-name>/...
├── e2e/
│   └── <project-name>-e2e/
│       └── __snapshots__/...
├── tmp/
│    └── e2e/
│       └── registry-<port>/
│           ├── storage/...
│           ├── node_modules/...
│           └── <test-name>/...
│                └── src/...
├── package-lock.json // npm install/uninstall installs into workspace root
└── package.json // npm install/uninstall installs into workspace root
```

After running the E2E tests all changes are reverted, and the workspace is in the same state as before the tests.

### E2E testing troubleshooting

- start local registry manually with `nx start-verdaccio` - logs port
- check if a package is published with `nx npm-check <project-name> --registry=http://localhost:<port>`
- install a package to a registry `nx npm-install <project-name> --registry=http://localhost:<port>`
- uninstall a package from a registry `nx npm-uninstall <project-name>`
