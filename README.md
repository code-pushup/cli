# Code PushUp CLI

**Quality metrics for your software project. Configure what you want to track using your favourite tools, integrate it in your CI and visualize reports in a beautiful dashboard.**

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
npx nx affected:lint --max-warnings=0
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
