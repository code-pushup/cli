# react-todos-app

This application serves as an example project for running integration and E2E tests.

## ESLint plugin

Runs ESLint based on defined configuration.

> [!NOTE]
> Any changes to the `.eslintrc.js` will require updating ESLint tests.

## Coverage plugin

Collects coverage of the project. Relevant test file: `App.test.jsx`

> [!NOTE]
> Any changes to the project features or tests will require updating coverage tests.

## JS packages plugin

Adds package files to test security audit and outdated dependencies.

> [!NOTE]
> Any changes to `package.json` or `package-lock.json` will require updating package dependencies tests.

The `dependencies` section is meant to be fully up-to-date and have no vulnerabilities.

The `devDependencies` section is meant to produce outdated dependencies as follows:

- up-to-date: `esbuild`, `verdaccio`
- outdated patch version: `vitest`
- outdated minor version: `memfs`
- outdated major version: `prettier`, `vite`

The `devDependencies` section is meant to produce the following vulnerabilities:

- `verdaccio`: 5 moderate vulnerabilities in version 5.15.0

> [!IMPORTANT]
> If possible, do not change the dev dependencies relevant to tests as they produce diverse results for the plugin.
