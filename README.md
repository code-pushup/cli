# Code PushUp CLI

🔎🔬 **Quality metrics for your software project.** 📉🔍

1. ⚙️ **Configure what you want to track using your favourite tools.**
2. 🤖 **Integrate it in your CI.**
3. 🌈 **Visualize reports in a beautiful dashboard.**

---

This monorepo contains code for open-source Code PushUp NPM packages:

- [@code-pushup/cli](./packages/cli) - **CLI** for **collecting** audit results and **uploading** report to portal
- [@code-pushup/core](./packages/core) - implementation of **core business logic** (useful for custom integrations)
- [@code-pushup/models](./packages/models/) - **schemas and types** for data models (useful for custom plugins or other integrations)
- [@code-pushup/utils](./packages/utils/) - various **utilities** (useful for custom plugins or other integrations)
- plugins:
  - [@code-pushup/eslint-plugin](./packages/plugin-eslint/) - static analysis using **ESLint** rules

## Contributing

### Setup

Prerequisites:

- Node.js installed (LTS version)

Make sure to install dependencies:

```sh
npm install
```

### Development

Refer to docs on [how to run tasks in Nx](https://nx.dev/core-features/run-tasks).

Some examples:

```sh
# visualize project graph
npx nx graph

# run E2E tests for CLI
npx nx e2e cli-e2e

# run unit tests for all projects
npx nx run-many -t test

# build CLI along with packages it depends on
npx nx build cli

# lint projects affected by changes (compared to main branch)
npx nx affected:lint
```

### Git

Commit messages must follow [conventional commits](https://conventionalcommits.org/) format.
In order to be prompted with supported types and scopes, stage your changes and run `npm run commit`.

Branching strategy follows [trunk-based development](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development) guidelines.
Pushing to remote triggers a CI workflow, which runs automated checks on your changes.

The main branch should always have a linear history.
Therefore, PRs are merged via one of two strategies:

- rebase - branch cannot contain merge commits ([rebase instead of merge](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)),
- squash - single commit whose message is the PR title (should be in conventional commit format).

### Project tags

[Nx tags](https://nx.dev/core-features/enforce-module-boundaries) are used to enforce module boundaries in the project graph when linting.

Projects are tagged in two different dimensions - scope and type:

| tag             | description                                                                  | allowed dependencies           |
| :-------------- | :--------------------------------------------------------------------------- | :----------------------------- |
| `scope:core`    | core features and CLI (agnostic towards specific plugins)                    | `scope:core` or `scope:shared` |
| `scope:plugin`  | a specific plugin implementation (contract with core defined by data models) | `scope:shared`                 |
| `scope:shared`  | data models, utility functions, etc. (not specific to core or plugins)       | `scope:shared`                 |
| `scope:tooling` | supplementary tooling, e.g. code generation                                  | `scope:shared`                 |
| `type:app`      | application, e.g. CLI or example web app                                     | `type:feature` or `type:util`  |
| `type:feature`  | library with business logic for a specific feature                           | `type:util`                    |
| `type:util`     | general purpose utilities and types intended for reuse                       | `type:util`                    |
| `type:e2e`      | E2E testing                                                                  | `type:app` or `type:feature`   |

#### Special Targets

The repository includes a couple of common optional targets:

- `perf` - runs micro benchmarks of a project e.g. `nx perf utils` or `nx affected -t perf`

#### Special Folder

The repository standards organize reusable code specific to a target in dedicated folders at project root level.
This helps to organize and share target related code.

The following optional folders can be present in a project root;

- `perf` - micro benchmarks related code
- `test` - testing related code
- `docs` - docs related files
- `tooling` - tooling related code
