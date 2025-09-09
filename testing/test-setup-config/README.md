## Vitest config factory and setup presets

Utilities to centralize and standardize Vitest configuration across the monorepo.

- `vitest-config-factory.ts`: builds typed Vitest configs with sensible defaults
- `vitest-setup-presets.ts`: provides create functions and exportable setup file groups

The create functions (`createUnitConfig`, `createIntConfig`, `createE2eConfig`) automatically include appropriate setup files for each test type.

### Defaults

**Common**: `reporters: ['basic']`, `globals: true`, `environment: 'node'`, `pool: 'threads'` with `singleThread: true`, alias from tsconfig paths

**Coverage**: Unit/Int enabled (reports to `<projectRoot>/packages/<project>/.coverage`), E2E disabled. Excludes `['mocks/**', '**/types.ts']`

**Global setup**: Unit/Int use `['<projectRoot>/global-setup.ts']`, E2E none by default

**Include patterns**: Unit `src/**/*.unit.test.*`, Int `src/**/*.int.test.*`, E2E `tests/**/*.e2e.test.*`

### Setup files

**Automatic inclusion**: Unit (console mocking, cleanup, UI/filesystem mocks, basic matchers), Int (console mocking, cleanup), E2E (cleanup only)

**Custom setup files**: ⚠️ Specifying `setupFiles` in overrides will completely replace the defaults. To extend the default list, manually combine them with `setupPresets`:

- `setupPresets.unit.{base, git, portalClient, matchersCore, matcherPath}`
- `setupPresets.int.{base, cliui, fs, git, portalClient, matcherPath, chromePath}`
- `setupPresets.e2e.{base}`

### Parameters

- `projectKey`: Used for cache and coverage directory naming
- `projectRoot`: Required path/URL to the project root for resolving all paths
- Standard Vitest configuration options can be provided in the overrides parameter

### Examples

**Using defaults:**

```ts
export default createUnitConfig('my-package', import.meta.url);
```

**Extending default setup files:**

```ts
export default createIntConfig('my-package', import.meta.url, {
  setupFiles: [...setupPresets.int.base, ...setupPresets.int.git, './custom-setup.ts'],
});
```
