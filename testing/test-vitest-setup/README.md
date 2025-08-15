# test-vitest-setup

This library provides shared Vitest configurations for different test types in the Code PushUp monorepo, similar to the [cpu-prof vitest-setup](https://github.com/push-based/cpu-prof/tree/main/testing/vitest-setup).

## Features

✅ **Centralized Configuration**: Common Vitest settings shared across all projects  
✅ **Coverage at Project Root**: Coverage reports are generated at the project root level  
✅ **Type-specific Configs**: Separate configurations for unit, integration, and e2e tests  
✅ **Type-safe Interface**: Strongly typed configuration options with TypeScript interfaces  
✅ **Clean API**: Simple, consistent interface for all test types

## Configurations

The library provides three main configuration functions:

- `createSharedUnitVitestConfig()` - Configuration for unit tests
- `createSharedIntegrationVitestConfig()` - Configuration for integration tests
- `createSharedE2eVitestConfig()` - Configuration for end-to-end tests

## Setup Files

### File System Mocking

- `fs-with-cwd.setup-file.ts` - Mocks fs AND process.cwd() (default for most tests)
- `fs-memfs.setup-file.ts` - Only mocks fs, preserves real process.cwd() (for utility tests)

## Usage

### Basic Usage

```typescript
// vitest.unit.config.ts
import { defineConfig } from 'vitest/config';
import { createSharedUnitVitestConfig } from '../../testing/test-vitest-setup/src/utils/project-config.js';

export default defineConfig(() => {
  const baseConfig = createSharedUnitVitestConfig({
    projectRoot: __dirname,
    workspaceRoot: '../..',
  });

  return {
    ...baseConfig,
  };
});
```

### Custom Configuration

```typescript
// vitest.unit.config.ts
import { defineConfig } from 'vitest/config';
import { createSharedUnitVitestConfig } from '../../testing/test-vitest-setup/src/utils/project-config.js';

export default defineConfig(() => {
  const baseConfig = createSharedUnitVitestConfig({
    projectRoot: __dirname,
    workspaceRoot: '../..',
  });

  return {
    ...baseConfig,
    test: {
      ...baseConfig.test,
      coverage: {
        ...baseConfig.test.coverage,
        exclude: [...baseConfig.test.coverage.exclude, 'mocks/**', '**/types.ts', '**/*.config.ts'],
      },
      setupFiles: [...baseConfig.test.setupFiles, '../../testing/test-setup/src/lib/console.mock.ts'],
    },
  };
});
```

### Integration Tests

```typescript
// vitest.int.config.ts
import { defineConfig } from 'vitest/config';
import { createSharedIntegrationVitestConfig } from '../../testing/test-vitest-setup/src/utils/project-config.js';

export default defineConfig(() => {
  const baseConfig = createSharedIntegrationVitestConfig({
    projectRoot: __dirname,
    workspaceRoot: '../..',
  });

  return {
    ...baseConfig,
    test: {
      ...baseConfig.test,
      setupFiles: [...baseConfig.test.setupFiles, '../../testing/test-setup/src/lib/console.mock.ts', '../../testing/test-setup/src/lib/reset.mocks.ts'],
    },
  };
});
```

### E2E Tests

```typescript
// vitest.e2e.config.ts
import { defineConfig } from 'vitest/config';
import { createSharedE2eVitestConfig } from '../../testing/test-vitest-setup/src/utils/project-config.js';

export default defineConfig(() => {
  const baseConfig = createSharedE2eVitestConfig({
    projectRoot: __dirname,
    workspaceRoot: '../..',
  });

  return {
    ...baseConfig,
    test: {
      ...baseConfig.test,
      globalSetup: './global-setup.ts',
    },
  };
});
```

## Coverage Configuration

Coverage reports are automatically configured to be saved at the project root:

- Unit tests: `./coverage/{project-name}/unit`
- Integration tests: `./coverage/{project-name}/integration`
- E2E tests: `./coverage/{project-name}/e2e`

This ensures each project has its own organized coverage directory structure at the project root level.

## Configuration Options

### SharedVitestConfigOptions

```typescript
type SharedVitestConfigOptions = {
  projectRoot: string; // Path to the project root
  workspaceRoot: string; // Path to the workspace root
  enabled?: boolean; // Enable/disable coverage (default: true)
  environment?: 'node' | 'jsdom' | 'happy-dom'; // Test environment (default: 'node')
  include?: string[]; // Custom include patterns
  exclude?: string[]; // Custom exclude patterns
  testTimeout?: number; // Custom test timeout
};
```

## Migration Guide

To migrate from the legacy `mergeConfig` approach:

1. **Replace imports**:

```diff
- import { mergeConfig } from 'vite';
- import { unitTestConfig, createUnitTestConfig } from '../../testing/test-vitest-setup/src/index.js';
+ import { defineConfig } from 'vitest/config';
+ import { createSharedUnitVitestConfig } from '../../testing/test-vitest-setup/src/utils/project-config.js';
```

2. **Update configuration structure**:

```diff
- export default mergeConfig(unitTestConfig, createUnitTestConfig('my-project', {
-   test: {
-     coverage: { exclude: ['mocks/**'] },
-   },
- }));

+ export default defineConfig(() => {
+   const baseConfig = createSharedUnitVitestConfig({
+     projectRoot: __dirname,
+     workspaceRoot: '../..',
+   });

+   return {
+     ...baseConfig,
+     test: {
+       ...baseConfig.test,
+       coverage: {
+         ...baseConfig.test.coverage,
+         exclude: [...baseConfig.test.coverage.exclude, 'mocks/**'],
+       },
+     },
+   };
+ });
```

3. **Benefits of the new approach**:
   - **Type Safety**: Full TypeScript support with proper interfaces
   - **Consistency**: All projects use the same configuration structure
   - **Maintainability**: Centralized configuration logic
   - **Flexibility**: Easy to extend and customize per project
   - **Performance**: Better caching and optimization

## Architecture

The new system uses a centralized configuration approach:

1. **Core Function**: `createSharedVitestConfig()` handles all test types
2. **Wrapper Functions**: Type-specific functions provide convenient APIs
3. **Deep Merging**: Coverage configuration is properly merged to preserve settings
4. **Type Safety**: Full TypeScript interfaces ensure correct usage

This replaces the previous `mergeConfig` approach with a more robust, type-safe, and maintainable solution.
