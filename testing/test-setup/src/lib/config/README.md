## Vitest config factory and setup presets

This folder contains utilities to centralize and standardize Vitest configuration across the monorepo.

### Files

- `vitest-config-factory.ts`: builds typed Vitest configs with sensible defaults.
- `vitest-setup-presets.ts`: provides create functions and exportable setup file groups.

### Goals

- Reduce duplication across `vitest.*.config.ts` files.
- Automatically include common setup files for each test type.
- Allow easy extension when additional setup files are needed.

### How it works

The create functions (`createUnitConfig`, `createIntConfig`, `createE2eConfig`) automatically include base setup files appropriate for each test type. If you need additional or different setup files, provide them in the test overrides and they will be used instead.

### Defaults

Common to all kinds:

- `reporters: ['basic']`, `globals: true`, `environment: 'node'`
- `alias: tsconfigPathAliases()`
- `pool: 'threads'` with `singleThread: true`
- Cache directories resolved from `projectRoot` (absolute paths)

Coverage:

- Unit/Int: enabled by default, reports to `<projectRoot>/packages/<project>/.coverage`
- E2E: disabled by default, reports to `<projectRoot>/e2e/<project>/.coverage` if enabled
- Default exclude: `['mocks/**', '**/types.ts']`

Global setup:

- Unit/Int: `['<projectRoot>/global-setup.ts']` by default
- E2E: none by default (set per-suite if needed)

Include patterns:

- Unit: `src/**/*.unit.test.*`
- Int: `src/**/*.int.test.*`
- E2E: `tests/**/*.e2e.test.*`

### Setup files behavior

**Automatic inclusion**: Each test type automatically includes its base setup files:

- Unit tests: console mocking, cleanup, common UI/filesystem mocks, and basic matchers
- Integration tests: console mocking and cleanup only
- E2E tests: cleanup only

**Custom setup files**: To use additional or different setup files, provide them in the test configuration overrides. The exported `setupPresets` object contains grouped setup files that can be combined as needed.

**Available setup file groups**:

- `setupPresets.unit.{base, git, portalClient, matchersCore, matcherPath}`
- `setupPresets.int.{base, cliui, fs, git, portalClient, matcherPath, chromePath}`
- `setupPresets.e2e.{base}`

### Key parameters

- `projectKey`: Used for cache and coverage directory naming
- `projectRoot`: Required path/URL to the project root for resolving all paths
- Standard Vitest configuration options can be provided in the overrides parameter

### Notes

- Coverage is enabled by default for unit/int tests, disabled by default for E2E tests
- All path resolution is handled automatically relative to the provided `projectRoot`
