# @code-pushup/create-cli

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Fcreate-cli.svg)](https://www.npmjs.com/package/@code-pushup/create-cli)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Fcreate-cli)](https://npmtrends.com/@code-pushup/create-cli)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/create-cli)](https://www.npmjs.com/package/@code-pushup/create-cli?activeTab=dependencies)

An interactive setup wizard that scaffolds a `code-pushup.config.ts` file in your repository.

## Usage

```bash
npm init @code-pushup/cli
```

The wizard will prompt you to select plugins and configure their options, then generate a `code-pushup.config.ts` file.

## Options

| Option                | Type                                 | Default       | Description                            |
| --------------------- | ------------------------------------ | ------------- | -------------------------------------- |
| **`--plugins`**       | `string[]`                           |               | Comma-separated plugin slugs to enable |
| **`--config-format`** | `'ts'` \| `'js'` \| `'mjs'`          | auto-detected | Config file format                     |
| **`--mode`**          | `'standalone'` \| `'monorepo'`       | auto-detected | Setup mode                             |
| **`--ci`**            | `'github'` \| `'gitlab'` \| `'none'` |               | CI/CD integration                      |
| **`--dry-run`**       | `boolean`                            | `false`       | Preview changes without writing files  |
| **`--yes`**, `-y`     | `boolean`                            | `false`       | Skip prompts and use defaults          |

### Plugin options

Each plugin exposes its own configuration keys that can be passed as CLI arguments to skip the corresponding prompts.

#### ESLint

| Option                    | Type      | Default       | Description           |
| ------------------------- | --------- | ------------- | --------------------- |
| **`--eslint.eslintrc`**   | `string`  | auto-detected | Path to ESLint config |
| **`--eslint.patterns`**   | `string`  | `src` or `.`  | File patterns to lint |
| **`--eslint.categories`** | `boolean` | `true`        | Add categories        |

#### Coverage

| Option                          | Type                                       | Default              | Description                    |
| ------------------------------- | ------------------------------------------ | -------------------- | ------------------------------ |
| **`--coverage.framework`**      | `'jest'` \| `'vitest'` \| `'other'`        | auto-detected        | Test framework                 |
| **`--coverage.configFile`**     | `string`                                   | auto-detected        | Path to test config file       |
| **`--coverage.reportPath`**     | `string`                                   | `coverage/lcov.info` | Path to LCOV report file       |
| **`--coverage.testCommand`**    | `string`                                   | auto-detected        | Command to run tests           |
| **`--coverage.types`**          | `('function'` \| `'branch'` \| `'line')[]` | all                  | Coverage types to measure      |
| **`--coverage.continueOnFail`** | `boolean`                                  | `true`               | Continue if test command fails |
| **`--coverage.categories`**     | `boolean`                                  | `true`               | Add categories                 |

#### JS Packages

| Option                               | Type                                                       | Default       | Description       |
| ------------------------------------ | ---------------------------------------------------------- | ------------- | ----------------- |
| **`--js-packages.packageManager`**   | `'npm'` \| `'yarn-classic'` \| `'yarn-modern'` \| `'pnpm'` | auto-detected | Package manager   |
| **`--js-packages.checks`**           | `('audit'` \| `'outdated')[]`                              | both          | Checks to run     |
| **`--js-packages.dependencyGroups`** | `('prod'` \| `'dev'` \| `'optional')[]`                    | `prod`, `dev` | Dependency groups |
| **`--js-packages.categories`**       | `boolean`                                                  | `true`        | Add categories    |

#### TypeScript

| Option                        | Type      | Default       | Description            |
| ----------------------------- | --------- | ------------- | ---------------------- |
| **`--typescript.tsconfig`**   | `string`  | auto-detected | TypeScript config file |
| **`--typescript.categories`** | `boolean` | `true`        | Add categories         |

#### Lighthouse

| Option                        | Type                                                             | Default                 | Description                     |
| ----------------------------- | ---------------------------------------------------------------- | ----------------------- | ------------------------------- |
| **`--lighthouse.urls`**       | `string \| string[]`                                             | `http://localhost:4200` | Target URL(s) (comma-separated) |
| **`--lighthouse.categories`** | `('performance'` \| `'a11y'` \| `'best-practices'` \| `'seo')[]` | all                     | Categories                      |

#### JSDocs

| Option                    | Type                 | Default                                      | Description                            |
| ------------------------- | -------------------- | -------------------------------------------- | -------------------------------------- |
| **`--jsdocs.patterns`**   | `string \| string[]` | `src/**/*.ts, src/**/*.js, !**/node_modules` | Source file patterns (comma-separated) |
| **`--jsdocs.categories`** | `boolean`            | `true`                                       | Add categories                         |

#### Axe

| Option                  | Type                                                         | Default                 | Description                                |
| ----------------------- | ------------------------------------------------------------ | ----------------------- | ------------------------------------------ |
| **`--axe.urls`**        | `string \| string[]`                                         | `http://localhost:4200` | Target URL(s) (comma-separated)            |
| **`--axe.preset`**      | `'wcag21aa'` \| `'wcag22aa'` \| `'best-practice'` \| `'all'` | `wcag21aa`              | Accessibility preset                       |
| **`--axe.setupScript`** | `boolean`                                                    | `false`                 | Create setup script for auth-protected app |
| **`--axe.categories`**  | `boolean`                                                    | `true`                  | Add categories                             |

### Examples

Run interactively (default):

```bash
npm init @code-pushup/cli
```

Skip prompts and enable specific plugins:

```bash
npm init @code-pushup/cli -- -y --plugins=eslint,coverage
```

Set up a monorepo with GitHub CI integration:

```bash
npm init @code-pushup/cli -- --mode=monorepo --ci=github
```

Preview the generated config without writing:

```bash
npm init @code-pushup/cli -- -y --dry-run
```
