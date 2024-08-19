# Contributing

## Setup

Prerequisites:

- Node.js installed (LTS version)

Make sure to install dependencies:

```sh
npm install
```

## Environment Variables

This table provides a quick overview of the environmental setup, with detailed explanations in the corresponding sections.

| Feature                          | Local Default | CI Default         | Description                                                                                                                   |
| -------------------------------- | ------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `env.INCLUDE_SLOW_TESTS` **❗️** | `false`       | `true`             | Controls inclusion of long-running tests. Overridden by setting. Details in the [Testing](#Testing) section.                  |
| `env.CUSTOM_CHROME_PATH`         | N/A           | Windows **❗️❗️** | Path to Chrome executable. See [plugin-lighthouse/CONTRIBUTING.md](./packages/plugin-lighthouse/CONTRIBUTING.md#chrome-path). |
| Quality Pipeline                 | Off           | On                 | Runs all plugins against the codebase.                                                                                        |

**❗️** Test Inclusion Logic

- `INCLUDE_SLOW_TESTS='false'` skips long tests.
- without `INCLUDE_SLOW_TESTS`, tests run if `CI` is set.

**❗️❗️** Windows specific path set only in CI

- some setups also require this setting locally

## Development

Refer to docs on [how to run tasks in Nx](https://nx.dev/core-features/run-tasks).

Some examples:

```sh
# visualize project graph
npx nx graph

# run unit tests for all projects
npx nx run-many -t unit-test

# run integration tests for all projects
npx nx run-many -t integration-test

# run E2E tests for CLI
npx nx e2e cli-e2e

# build CLI along with packages it depends on
npx nx build cli

# lint projects affected by changes (compared to main branch)
npx nx affected:lint

# run Code PushUp command on this repository
npx nx code-pushup -- collect
```

## Testing

Some of the plugins have a longer runtime. In order to ensure better DX, longer tests are excluded by default when executing tests locally.

You can control the execution of long-running tests over the `INCLUDE_SLOW_TESTS` environment variable.

To change this setup, open (or create) the `.env` file in the root folder.
Edit or add the environment variable there as follows: `INCLUDE_SLOW_TESTS=true`.

### Publishing

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

### E2e testing

> [!NOTE] Projects that need verdaccio are identified over the `e2e` target.
> Those libraries will have dynamic targets to start verdaccio and test the package.

All e2e tests use verdaccio to test the build artefact in a real registry.

Every e2e project in the monorepo has the following targets:

- [`start-verdaccio`](./tools/src/verdaccio/README.md#start-verdaccio) - start a local registry

**Running e2e tests for a given project:**

Every project in the monorepo that has e2e tests follows the project naming pattern: `<project-name>-e2e`.

Examples:

- `npx nx e2e cli-e2e` - run e2e tests for the cli project
- `npx nx e2e cli-e2e --skipNxCache` - pass Nx CLI arguments
- `npx nx run-many -t e2e` - run all e2e tests

#### E2e testing process

The `e2e` testing process is complex and involves multiple steps.

Here the involved files:

// ascii directory structure

```text 
Root/
├── .verdaccio/
│   ├── config.yaml
│   └── storage/
├── e2e/
│   └── <project-name>-e2e/
│       ├── tests/
│       │   └── <file-name>.e2e.ts
│       └── vite.config.e2e.ts
├── package/
│   └── <project-name>/
│       ├── ...
│       └── package.json
├── global-setup.e2e.ts
├── tools/
│    ├── src/
│    │   └── verdaccio/
│    │   ├── global-setup.e2e.ts
│    │    └── verdaccio.plugin.ts
```

The `e2e` target looks like this:

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

The important part is the `configFile` option.
This file is used to configure the Vite test runner with a global setup script `global-setup.e2e.ts`:

```typescript
export default defineConfig({
    // ...
    globalSetup: ['../../global-setup.e2e.ts'],
});
```

Runner the target executes the following steps:

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

## Git

Commit messages must follow [conventional commits](https://conventionalcommits.org/) format.
In order to be prompted with supported types and scopes, stage your changes and run `npm run commit`.

Branching strategy follows [trunk-based development](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development) guidelines.
Pushing to remote triggers a CI workflow, which runs automated checks on your changes.

The main branch should always have a linear history.
Therefore, PRs are merged via one of two strategies:

- rebase - branch cannot contain merge commits ([rebase instead of merge](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)),
- squash - single commit whose message is the PR title (should be in conventional commit format).

## Project tags

[Nx tags](https://nx.dev/core-features/enforce-module-boundaries) are used to enforce module boundaries in the project graph when linting.

Projects are tagged in two different dimensions - scope and type:

| tag                 | description                                                                  | allowed dependencies                               |
| :------------------ | :--------------------------------------------------------------------------- | :------------------------------------------------- |
| `scope:core`        | core features and CLI (agnostic towards specific plugins)                    | `scope:core` or `scope:shared`                     |
| `scope:plugin`      | a specific plugin implementation (contract with core defined by data models) | `scope:shared`                                     |
| `scope:shared`      | data models, utility functions, etc. (not specific to core or plugins)       | `scope:shared`                                     |
| `scope:tooling`     | supplementary tooling, e.g. code generation                                  | `scope:tooling`, `scope:shared`                    |
| `scope:internal`    | internal project, e.g. example plugin                                        | any                                                |
| `type:app`          | application, e.g. CLI or example web app                                     | `type:feature`, `type:util` or `type:testing-util` |
| `type:feature`      | library with business logic for a specific feature                           | `type:util` or `type:testing-util`                 |
| `type:util`         | general purpose utilities and types intended for reuse                       | `type:util` or `type:testing-util`                 |
| `type:e2e`          | E2E testing                                                                  | `type:app`, `type:feature` or `type:testing-util`  |
| `type:testing-util` | testing utilities                                                            | `type:util`                                        |

## Special targets

The repository includes a couple of common optional targets:

- `perf` - runs micro benchmarks of a project e.g. `nx perf utils` or `nx affected -t perf`

## Special folders

The repository standards organize reusable code specific to a target in dedicated folders at project root level.
This helps to organize and share target related code.

The following optional folders can be present in a project root;

- `perf` - micro benchmarks related code
- `mocks` - test fixtures and utilities specific for a given project
- `docs` - files related to documentation
- `tooling` - tooling related code
