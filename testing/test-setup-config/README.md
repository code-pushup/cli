## Vitest config factory and setup presets

Utilities to centralize and standardize Vitest configuration across the monorepo.

- `vitest-config-factory.ts`: builds typed Vitest configs with sensible defaults
- `vitest-setup-presets.ts`: provides create functions and exportable setup file groups

The create functions (`createUnitConfig`, `createIntConfig`, `createE2eConfig`) automatically include appropriate setup files for each test type. See the unit tests for detailed documentation of defaults, coverage settings, and setup file presets.

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
