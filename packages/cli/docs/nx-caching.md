# Caching Example Nx

To cache plugin runner output, you can use the `--cache.write` and `--cache.read` options in combination with `--onlyPlugins` and `--persist.skipReports` command options.

## `{projectRoot}/code-pushup.config.ts`

```ts
import coveragePlugin from '@code-pushup/coverage-plugin';
import jsPackagesPlugin from '@code-pushup/js-packages-plugin';
import type { CoreConfig } from '@code-pushup/models';

export default {
  plugins: [
    await coveragePlugin({
      reports: ['coverage/lcov.info'],
      coverageTypes: ['function', 'branch', 'line'],
    }),
    await jsPackagesPlugin(),
  ],
  upload: {
    server: 'https://portal.code-pushup.dev/api',
    organization: 'my-org',
    project: 'lib-a',
    apiKey: process.env.CP_API_KEY,
  },
} satisfies CoreConfig;
```

## `{projectRoot}/package.json`

```json
{
  "name": "lib-a",
  "targets": {
    "int-test": {
      "cache": true,
      "outputs": ["{options.coverage.reportsDirectory}"],
      "executor": "@nx/vite:test",
      "options": {
        "configFile": "packages/lib-a/vitest.int.config.ts",
        "coverage.reportsDirectory": "{projectRoot}/coverage/int-test"
      }
    },
    "unit-test": {
      "cache": true,
      "outputs": ["{options.coverage.reportsDirectory}"],
      "executor": "@nx/vite:test",
      "options": {
        "configFile": "packages/lib-a/vitest.unit.config.ts",
        "coverage.reportsDirectory": "{projectRoot}/coverage/unit-test"
      }
    },
    "code-pushup:coverage": {
      "cache": true,
      "outputs": ["{options.outputPath}"],
      "executor": "nx:run-commands",
      "options": {
        "command": "npx @code-pushup/cli collect",
        "config": "{projectRoot}/code-pushup.config.ts",
        "cache.write": true,
        "persist.skipReports": true,
        "persist.outputDir": "{projectRoot}/.code-pushup",
        "upload.project": "{projectName}",
        "outputPath": "{projectRoot}/.code-pushup/coverage"
      },
      "dependsOn": ["unit-test", "int-test"]
    },
    "code-pushup:js-packages": {
      "cache": true,
      "outputs": ["{options.outputPath}"],
      "executor": "nx:run-commands",
      "options": {
        "command": "npx @code-pushup/cli collect",
        "config": "{projectRoot}/code-pushup.config.ts",
        "cache.write": true,
        "persist.skipReports": true,
        "persist.outputDir": "{projectRoot}/.code-pushup",
        "upload.project": "{projectName}",
        "onlyPlugins": "js-packages",
        "outputPath": "{projectRoot}/.code-pushup/js-packages"
      }
    },
    "code-pushup": {
      "cache": true,
      "outputs": ["{options.outputPath}"],
      "executor": "nx:run-commands",
      "options": {
        "command": "node packages/cli/src/index.ts",
        "config": "{projectRoot}/code-pushup.config.ts",
        "cache.read": true,
        "upload.project": "{projectName}",
        "outputPath": "{projectRoot}/.code-pushup"
      },
      "dependsOn": ["code-pushup:coverage", "code-pushup:js-packages"]
    }
  }
}
```

## Nx Task Graph

This configuration creates the following task dependency graph:

**Legend:**

- 🐳 = Cached target

```mermaid
graph TD
  A[lib-a:code-pushup 🐳] --> B[lib-a:code-pushup:coverage 🐳]
  A --> E[lib-a:code-pushup:js-packages]
  B --> C[lib-a:unit-test 🐳]
  B --> D[lib-a:int-test 🐳]
```

## Command Line Example

```bash
# Run all affected projects e.g. nx run lib-a:code-pushup:coverage
nx affected --target=code-pushup:*

# Run all affected projects and upload the report to the portal
nx run reop-source:code-pushup autorun
```

This approach has the following benefits:

1. **Parallel Execution**: Plugins can run in parallel
2. **Finegrained Caching**: Code level cache invalidation enables usage of [affected](https://nx.dev/recipes/affected-tasks) command
3. **Dependency Management**: Leverage Nx task dependencies and its caching strategy
4. **Clear Separation**: Each plugin has its own target for better debugging and maintainability
