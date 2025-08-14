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

| Feature                         | Local Default | CI Default       | Description                                                                                                                   |
| ------------------------------- | ------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `env.INCLUDE_SLOW_TESTS` **❗️** | `false`       | `true`           | Controls inclusion of long-running tests. Overridden by setting. Details in the [Testing](#Testing) section.                  |
| `env.CUSTOM_CHROME_PATH`        | N/A           | Windows **❗️❗️** | Path to Chrome executable. See [plugin-lighthouse/CONTRIBUTING.md](./packages/plugin-lighthouse/CONTRIBUTING.md#chrome-path). |
| Quality Pipeline                | Off           | On               | Runs all plugins against the codebase.                                                                                        |

**❗️** Test Inclusion Logic

- `INCLUDE_SLOW_TESTS='false'` skips long tests.
- Without `INCLUDE_SLOW_TESTS`, tests run if `CI` is set.

**❗️❗️** Windows specific path set only in CI

- Some setups also require this setting locally.

## Development

Refer to docs on [how to run tasks in Nx](https://nx.dev/core-features/run-tasks).

Some examples:

```sh
# visualize project graph
npx nx graph

# run unit tests for all projects
npx nx run-many -t unit-test

# run integration tests for all projects
npx nx run-many -t int-test

# run E2E tests for CLI
npx nx e2e-test cli-e2e

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

### Testing with pkg-new

You can test the CLI using published packages from pull requests via [pkg-new](https://pkg.pr.new/). This is useful for testing changes before they are merged.

To test a specific PR (replace `<PR_NUMBER>` with the actual PR number):

```bash
# Install required dependencies first
npm install \
  https://pkg.pr.new/code-pushup/cli/@code-pushup/utils@<PR_NUMBER> \
  https://pkg.pr.new/code-pushup/cli/@code-pushup/models@<PR_NUMBER> \
  https://pkg.pr.new/code-pushup/cli/@code-pushup/core@<PR_NUMBER> \
  https://pkg.pr.new/code-pushup/cli/@code-pushup/cli@<PR_NUMBER>
```

Update nx.json to use pkg-new:

```jsonc
{
  "targetDefaults": {
    "code-pushup": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx https://pkg.pr.new/code-pushup/cli/@code-pushup/cli@<PR_NUMBER>", // instead of "command": "node packages/cli/src/index.ts"
        "args": [
          // ...
        ],
      },
    },
  },
}
```

**Note:** The `@code-pushup/portal-client` package may not be available via pkg-new, but it's an optional peer dependency and won't affect collect functionality. Only the upload command is not working.

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
