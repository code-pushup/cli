import * as matchers from 'jest-extended';
import { expect } from 'vitest';
import { assertFsMatchesStructure, fsMatcherKey } from './path.matcher.js';

expect.extend(matchers);
expect.extend({
  fsMatchesStructure: assertFsMatchesStructure,
});

// Export helper for use in tests
export { fsMatcherKey };
