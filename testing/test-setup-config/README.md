## Vitest Config Factory

Standardized Vitest configuration for the Code PushUp monorepo.

### Usage

#### Unit tests:

```typescript
import { createUnitTestConfig } from '@code-pushup/test-setup-config';

export default createUnitTestConfig('my-package');
```

#### Integration tests:

```typescript
import { createIntTestConfig } from '@code-pushup/test-setup-config';

export default createIntTestConfig('my-package');
```

#### E2E tests:

```typescript
import { createE2ETestConfig } from '@code-pushup/test-setup-config';

export default createE2ETestConfig('my-e2e');

// With options:
export default createE2ETestConfig('my-e2e', {
  testTimeout: 60_000,
});
```
