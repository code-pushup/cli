# @code-pushup/ci

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Fci.svg)](https://www.npmjs.com/package/@code-pushup/ci)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Fcli)](https://npmtrends.com/@code-pushup/ci)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/ci)](https://www.npmjs.com/package/@code-pushup/ci?activeTab=dependencies)

🔎🔬 **Quality metrics for your software project.** 📉🔍

1. ⚙️ **Configure what you want to track using your favourite tools.**
2. 🤖 **Integrate it in your CI.**
3. 🌈 **Visualize reports in a beautiful dashboard.**

---

This package exports **provider-agnostic core logic for running Code PushUp in CI pipelines**. It serves as the base for the following provider integrations:

|                |                                                                                                     |
| :------------- | :-------------------------------------------------------------------------------------------------- |
| GitHub Actions | [`code-pushup/github-action`](https://github.com/marketplace/actions/code-pushup)                   |
| GitLab CI/CD   | [`code-pushup/gitlab-pipelines-template`](https://gitlab.com/code-pushup/gitlab-pipelines-template) |

## Setup

```sh
npm install @code-pushup/ci
```

```sh
yarn add @code-pushup/ci
```

```sh
pnpm add @code-pushup/ci
```

## Usage

The `runInCI` function implements the full CI flow:

```ts
import { runInCI } from '@code-pushup/ci';

const result = await runInCI(
  {
    /* Git refs */
  },
  {
    /* Provider API client */
  },
  {
    /* Options */
  },
);
```

## Parameters

### Git refs

For each CI run, you must pass in the commit SHA and Git ref (e.g. `main`) of what was pushed.
These values can be detected from the CI environment, the details depend on which provider is being used.

If only the `head` is supplied, then Code PushUp will collect a new report and optionally upload it to portal (depending on your Code PushUp config).
If triggered by a pull request, then specify the `base` ref as well.
This will additionally compare reports from both source and target branches and post a comment to the PR.

| Property | Required | Type                           | Description           |
| :------- | :------: | :----------------------------- | :-------------------- |
| `head`   |   yes    | `{ ref: string, sha: string }` | Current branch/commit |
| `base`   |    no    | `{ ref: string, sha: string }` | Branch targeted by PR |

### Provider API client

The PR flow requires interacting with the Git provider's API to post a comparison comment.
Wrap these requests in functions and pass them in as an object which configures the provider.

| Property                 | Required | Type                                             | Description                                                                                                          |
| :----------------------- | :------: | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `createComment`          |   yes    | `(body: string) => Promise<Comment>`             | Posts a new comment to PR                                                                                            |
| `updateComment`          |   yes    | `(id: number, body: string) => Promise<Comment>` | Updates existing PR comment                                                                                          |
| `listComments`           |   yes    | `() => Promise<Comment[]>`                       | Fetches all comments from PR                                                                                         |
| `maxCommentChars`        |   yes    | `number`                                         | Character limit for comment body                                                                                     |
| `downloadReportArtifact` |    no    | `(project?: string) => Promise<string \| null>`  | Fetches previous (root/project) `report.json` for base branch and returns path, used as cache to speed up comparison |

A `Comment` object has the following required properties:

| Property | Type     | Description                           |
| :------- | :------- | :------------------------------------ |
| `id`     | `number` | Comment ID                            |
| `body`   | `string` | Content of comment as Markdown string |
| `url`    | `string` | Web link to comment in PR             |

### Options

Optionally, you can override default options for further customization:

| Property          | Type                      | Default                          | Description                                                                       |
| :---------------- | :------------------------ | :------------------------------- | :-------------------------------------------------------------------------------- |
| `monorepo`        | `boolean \| MonorepoTool` | `false`                          | Enables [monorepo mode](#monorepo-mode)                                           |
| `projects`        | `string[] \| null`        | `null`                           | Custom projects configuration for [monorepo mode](#monorepo-mode)                 |
| `task`            | `string`                  | `'code-pushup'`                  | Name of command to run Code PushUp per project in [monorepo mode](#monorepo-mode) |
| `directory`       | `string`                  | `process.cwd()`                  | Directory in which Code PushUp CLI should run                                     |
| `config`          | `string \| null`          | `null` [^1]                      | Path to config file (`--config` option)                                           |
| `silent`          | `boolean`                 | `false`                          | Toggles if logs from CLI commands are printed                                     |
| `bin`             | `string`                  | `'npx --no-install code-pushup'` | Command for executing Code PushUp CLI                                             |
| `detectNewIssues` | `boolean`                 | `true`                           | Toggles if new issues should be detected and returned in `newIssues` property     |
| `logger`          | `Logger`                  | `console`                        | Logger for reporting progress and encountered problems                            |

[^1]: By default, the `code-pushup.config` file is autodetected as described in [`@code-pushup/cli` docs](../cli/README.md#configuration).

The `Logger` object has the following required properties:

| Property | Type                        | Description        |
| :------- | :-------------------------- | :----------------- |
| `error`  | `(message: string) => void` | Prints error log   |
| `warn`   | `(message: string) => void` | Prints warning log |
| `info`   | `(message: string) => void` | Prints info log    |
| `debug`  | `(message: string) => void` | Prints debug log   |

## Standalone mode

By default, it is assumed that Code PushUp is set up to run on the whole repo with one command (_standalone mode_).
If you want to run Code PushUp on multiple projects separately, you should enable [_monorepo mode_](#monorepo-mode).

### Standalone result

In standalone mode, the resolved object will include paths to report files (JSON and Markdown formats), as well as diff files, comment ID and new issues in case of PR comparisons.

```ts
const result = await runInCI(refs, api);

if (result.mode === 'standalone') {
  const {
    // output files, can be uploaded as job artifact
    artifacts: { report, diff },
    // ID of created/updated PR comment
    commentId,
    // array of source code issues, can be used to annotate changed files in PR
    newIssues,
  } = result;
}
```

## Monorepo mode

For monorepo setups, Code PushUp reports can be collected and compared
individually per project. All project comparisons are then combined into a
single PR comment.

Use the `monorepo` option to activate monorepo mode:

```ts
await runInCI(refs, api, {
  monorepo: true,
});
```

The `runInCI` function will try to detect which monorepo tool you're using from the file system.
The following tools are supported out of the box:

- [Nx](https://nx.dev/)
- [Turborepo](https://turbo.build/)
- [Yarn workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/)
- [pnpm workspace](https://pnpm.io/workspaces)
- [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces)

If you're using one of these tools, you can also skip auto-detection by setting
`monorepo` option to `'nx'`, `'turbo'`, `'yarn'`, `'pnpm'` or `'npm'`.

If none of these tools are detected, then the fallback is to run Code PushUp in
all folders which have a `package.json` file. If that's not what you want, then
you can also configure folder patterns using the `projects` option (supports globs):

```ts
await runInCI(refs, api, {
  monorepo: true,
  projects: ['frontend', 'backend/*'],
});
```

Based on which monorepo tool is used, Code PushUp CLI commands will be executed
using a `package.json` script, Nx target, Turbo task, or binary executable (as
fallback). By default, these are expected to be called `code-pushup`, but you
can override the name using the `task` option:

```ts
await runInCI(refs, api, {
  monorepo: 'nx',
  task: 'analyze', // custom Nx target
});
```

### Monorepo result

In monorepo mode, the resolved object includes the merged diff at the top-level, as well as a list of projects.
Each project has its own report files and issues.

```ts
const result = await runInCI(refs, api);

if (result.mode === 'monorepo') {
  const {
    // array of objects with result for each project
    projects,
    // ID of created/updated PR comment
    commentId,
    // merged report-diff.md used in PR comment, can also be uploaded as job artifact
    diffArtifact,
  } = result;

  for (const project of projects) {
    const {
      // detected project name (from package.json, project.json or folder name)
      name,
      // output files, can be uploaded as job artifacts
      artifacts: { report, diff },
      // array of source code issues, can be used to annotate changed files in PR
      newIssues,
    } = project;
  }
}
```
