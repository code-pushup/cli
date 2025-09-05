import { afterAll, beforeAll, beforeEach, vi } from 'vitest';

/* eslint-disable functional/immutable-data, @typescript-eslint/no-dynamic-delete */
const processEnvCP = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => k.startsWith('CP_')),
);

// Clear all CodePush-related environment variables before each test suite
beforeAll(() => {
  Object.entries(process.env)
    .filter(([k]) => k.startsWith('CP_'))
    // @TODO consider treating '' as undefined in CLI logic to make env stubbing cleaner. E.g. vi.stubEnv('CP_API_KEY', '')
    .forEach(([k]) => delete process.env[k]);
});

// Clear all mocks from previous tests
beforeEach(async () => {
  vi.unstubAllEnvs();
});

// Restore original environment variables after all tests have run
afterAll(() => {
  Object.entries(processEnvCP).forEach(([k, v]) => (process.env[k] = v));
});
/* eslint-enable functional/immutable-data, @typescript-eslint/no-dynamic-delete */
